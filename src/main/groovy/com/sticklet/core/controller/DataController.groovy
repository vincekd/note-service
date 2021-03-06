package com.sticklet.core.controller

import javax.servlet.http.HttpServletRequest
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

    @RequestMapping(value="/data/account", method=RequestMethod.DELETE)
    public @ResponseBody def deleteData(HttpServletRequest req, HttpServletResponse resp) {
        User user = curUser()
        logger.warn "deleting all data!!!! $user"
        dataServ.deleteAccount(user)
        req.session.invalidate()
        emptyJson()
    }

    @RequestMapping(value="/data/export/{type}", method=RequestMethod.GET)
    public @ResponseBody def exportData(@PathVariable('type') String type, HttpServletResponse resp) {
        User user = curUser()
        try {
            switch (type) {
                case "json":
                    resp.setContentType("application/json")
                    return dataServ.exportJson(user)
                case "xml":
                default:
                    File file = dataServ.exportXML(user)
                    resp.setContentType("text/xml")
                    resp.setHeader("Content-Disposition", "inline; filename=" + file.getName())
                    resp.outputStream.write(file.bytes)
                    return
            }
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
                    dataServ.importEvernote(user, file)
                    break
                case "sticklet":
                default:
                    dataServ.importSticklet(user, file)
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