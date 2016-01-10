package com.sticklet.core.util

import java.text.DateFormat
import java.text.SimpleDateFormat

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile

@Service
class EvernoteImportUtil {
    private static final Logger logger = LoggerFactory.getLogger(EvernoteImportUtil.class)

    private static final String enTime = "yyyyMMdd'T'HHmmss'Z'"

    private List<Map> readEnexFile(MultipartFile file) {
        XmlParser parser = makeXmlParser()
        Node base = parser.parse(file.inputStream)
        //notes
        List<Map> notes = base.children().collect { Node note ->
            Map<String, Object> out = [:]
            out["title"] = getNodeValue(note, "title")
            out["content"] = getNodeContent(getNodeValue(note, "content"))
            out["created"] = readTime(getNodeValue(note, "created"), enTime)
            out["updated"] = readTime(getNodeValue(note, "updated"), enTime)
            out["tags"] = note.get("tag").collect { Node tag ->
                tag.text()
            }
            out
        }
        notes
    }

    private String getNodeContent(String val) {
        XmlParser parser = makeXmlParser()
        Node node = parser.parseText(val)
        //keep html
        nodeToString(node)
    }

    //recreate html without attributes/special divs
    private String nodeToString(Node node) {
        String tag = node.name()
        String startTag = "<$tag>"
        String endTag = "</$tag>"
        if (tag == "br") {
            return "<br />"
        } else if (tag == "en-note") {
            startTag = ""
            endTag = ""
        }
        return (startTag + node.children().collect { def n ->
            if (n instanceof Node) {
                return nodeToString(n)
            }
            n ? n.toString() : ""
        }.join("") + endTag)
    }

    private def getNodeValue(Node node, String name) {
        NodeList nodes = node.get(name)
        return (nodes ? nodes[0].text() : null)
    }

    private Long readTime(String t, String formatString) {
        if (t) {
            DateFormat reader = new SimpleDateFormat(formatString, Locale.ENGLISH)
            Date date = reader.parse(t)
            return date.getTime()
        }
        (new Date()).getTime()
    }

    private XmlParser makeXmlParser() {
        XmlParser parser = new XmlParser(false, false, true)
        parser.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false)
        parser.setFeature("http://xml.org/sax/features/namespaces", false)
        parser
    }

}