package com.sticklet.core.util

import org.slf4j.Logger
import org.slf4j.LoggerFactory

class FileSystemUtil {
    private static final Logger logger = LoggerFactory.getLogger(FileSystemUtil.class)

    public static File getResourceFile(String path) {
        File file
        ClassLoader cl = Thread.currentThread().getContextClassLoader()
        def url
        try {
            url = cl.getResource(path)
            file = new File(url.toURI())
        } catch (URISyntaxException e) {
            logger.debug "filt system UriSyntaException: ${e.message}"
            file = new File(url.getPath())
        } catch (Exception e) {
            logger.debug "file system Exception: ${e.message}"
            try {
                path = path.replaceFirst("^/", "")
                url = cl.getResourceAsStream(path)
                file = File.createTempFile("getResourceFile-" + path, ".temp")
                file.bytes = url.bytes
            } catch (ex) {
                ex.printStackTrace()
                throw new FileNotFoundException("Could not locate file")
            }
        }
        file
    }
}