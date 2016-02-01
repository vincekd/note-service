package com.sticklet.core.service

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

import com.sticklet.core.model.Setting
import com.sticklet.core.model.User
import com.sticklet.core.repository.SettingRepo

@Service
class SettingsService {
    private static final Logger logger = LoggerFactory.getLogger(SettingsService.class)

    @Autowired
    private SettingRepo settingRepo

    public List<Setting> getUserSettings(User user) {
        List<Setting> initial = settingRepo.findAllByInitial(true)
        List<Setting> users = settingRepo.findAllByUser(user)
        initial.collect { Setting setting ->
            Setting userSet = users.find { it.name == setting.name}
            userSet ?: setting
        }
    }

    public  void deleteAll(User user) {
        List<Setting> settings = settingRepo.findAllByUser(user)
        settingRepo.delete(settings)
    }

    public void init(Map map) {
        Map<String, Object> settings = packValues(map, "", true)
        settings.each { String key, Map val ->
            Setting setting = getSetting(key)
            if (!setting) {
                setting = new Setting([
                    "name": key,
                    "value": val.value,
                    "user": null,
                    "userUpdatable": (val.userUpdatable == true),
                    "initial": true
                ])
            } else {
                setting.value = val.value
                setting.userUpdatable = val.userUpdatable
            }
            settingRepo.save(setting)
        }
    }

    public def get(String key) {
        Setting set = getSetting(key)
        if (set) {
            return set.value
        }
        null
    }
    public Setting getSetting(String key) {
        settingRepo.findByNameAndInitial(key, true)
    }
    public Setting getUserSetting(User user, String key) {
        settingRepo.findByUserAndName(user, key)
    }

    public boolean isUserUpdatable(Setting setting) {
        setting && setting.userUpdatable
    }

    //for user updated values, additional checks
    public List<Setting> createFromMap(User user, Map map) {
        Map<String, Object> settings = packValues(map, "")
        List<Setting> sets = []

        settings.each { String key, def val ->
            Setting orig = getSetting(key)
            if (isUserUpdatable(orig)) {
                Setting setting = new Setting([
                    "name": ("user." + user.id + "." + key),
                    "value": val,
                    "user": user
                ])
                sets << setting
            }
        }

        sets
    }

    public static Map<String, Object> packValues(def obj, String key) {
        packValues(obj, key, false)
    }
    public static Map<String, Object> packValues(def obj, String key, boolean initial) {
        key = key?.trim()
        Map outMap = [:]
        if (obj instanceof Map) {
            // is settings initial load
            if (initial && obj.containsKey("value")) {
                outMap[key] = obj
            } else { // user load
                obj.each { String k, def value ->
                    k = k?.trim()
                    String newKey = (key ? (key + "." + k) : k)
                    outMap += packValues(value, newKey, initial)
                }
            }
        } else if (obj instanceof List) {
            //use indices as keys (use []?)
            for (int i = 0; i < obj.size(); i++) {
                String newKey = (key ? (key + "." + i) : ("" + i))
                outMap += packValues(obj[i], newKey, initial)
            }
        } else {
            outMap[key] = obj
        }
        outMap
    }
}