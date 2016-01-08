package com.sticklet.core.model

import org.springframework.data.mongodb.core.mapping.Document

import com.sticklet.core.constant.DisplayPref
import com.sticklet.core.constant.SortPref
import com.sticklet.core.model.base.BaseModel

@Document
class UserPreferences extends BaseModel {
    DisplayPref display = DisplayPref.stacked
    SortPref sortBy = SortPref.created

    //custom colors
    //email alerts
}