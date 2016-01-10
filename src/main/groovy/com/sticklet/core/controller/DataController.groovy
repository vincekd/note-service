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
import com.sticklet.core.exception.ImportNotSupportedException
import com.sticklet.core.model.User
import com.sticklet.core.service.DataService

@Controller
class DataController extends BaseController {
    private static final Logger logger = LoggerFactory.getLogger(DataController.class)

    @Autowired
    private DataService dataServ

    @RequestMapping(value="/data/export", method=RequestMethod.GET, produces="text/xml")
    public @ResponseBody def exportData(HttpServletResponse resp) {
        User user = curUser()
        try {
            File file = dataServ.exportUserData(user)
            resp.setContentType("text/xml")
            resp.setHeader("Content-Disposition", "inline; filename=" + file.getName())
            resp.outputStream.write(file.bytes)
            logger.debug "Exporting file: {}", file
            return
        } catch (Exception e) {
            e.printStackTrace()
            statusServ.setStatusError(resp)
        }
        ""
    }

    @RequestMapping(value="/data/import/{type}", method=RequestMethod.POST, produces="application/json")
    public @ResponseBody def importData(@PathVariable("type") String type,
            @RequestParam("file") MultipartFile file, HttpServletResponse resp) {
        User user = curUser()
        try {
            switch (type?.toLowerCase()) {
                case "onenote":
                    dataServ.importOneNote(user, file)
                    break
                case "keep":
                    dataServ.importKeep(user, file)
                    break
                case "evernote":
                default:
                    dataServ.importEvernote(user, file)
            }
        } catch(ImportNotSupportedException e) {
            statusServ.setStatusBadRequest(resp)
        } catch (Exception e) {
            e.printStackTrace()
            statusServ.setStatusError(resp)
        }

        emptyJson()
    }
}