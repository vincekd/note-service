package com.sticklet.core.constant

class StickletConsts {
    //for notes
    public static final Integer MAX_TITLE_LENGTH = 100
    //for tags
    public static final Integer MAX_NAME_LENGTH = 50

    public static final boolean USE_TRASH = true
    public static final Long EMPTY_TRASH_AFTER = (1000L * 86400L * 30L) // 30 days
    //public static final Long EMPTY_TRASH_AFTER = (1000L * 60L * 5L) //5 minutes
    
    public static final String LESS_CACHE = "less.cache.map"
}