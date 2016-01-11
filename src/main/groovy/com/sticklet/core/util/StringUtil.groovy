package com.sticklet.core.util

class StringUtil {
    public static String underscoreToCamelCase(String source) {
        if (source) {
            source = source.toLowerCase().split("_").collect {
                it.capitalize()
            }.join("")
            source = source[0].toLowerCase() + source.substring(1)
        }
        source
    }
}