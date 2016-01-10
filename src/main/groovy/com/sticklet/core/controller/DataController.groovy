package com.sticklet.core.controller

import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.multipart.MultipartFile

import com.sticklet.core.controller.base.BaseController
import com.sticklet.core.service.DataService

@Controller
class DataController extends BaseController {
    private static final Logger logger = LoggerFactory.getLogger(DataController.class)

    @Autowired
    private DataService dataServ

    @RequestMapping(value="/data/import/{type}", method=RequestMethod.POST, produces="application/json")
    public @ResponseBody def importData(@PathVariable("type") String type,
            @RequestParam("file") MultipartFile file, HttpServletResponse resp) {
        try {
            switch (type) {
                case "keep":
                    logger.debug "google keep import not supported"
                    statusServ.setStatusBadRequest(resp)
                    break
                case "evernote":
                default:
                    dataServ.importEvernote(file)
            }

            //FrameboardZip zip = frameboardServ.extractXmlZip(file)
            //xmlImportServ.instantiate(zip)
            //Frameboard fb = xmlImportServ.importXML(curUser())
        } catch (Exception e) {
            e.printStackTrace()
            statusServ.setStatusError(resp)
        }

        emptyJson()
    }
}