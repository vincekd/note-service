package com.sticklet.core.util

class XmlUtil {
    public static XmlParser makeXmlParser() {
        XmlParser parser = new XmlParser(false, false, true)
        parser.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false)
        parser.setFeature("http://xml.org/sax/features/namespaces", false)
        parser
    }
    
    public static def getNodeValue(Node node, String name) {
        NodeList nodes = node.get(name)
        (nodes ? nodes[0].text() : null)
    }
}
