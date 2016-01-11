package com.sticklet.core.thread

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

import com.sticklet.core.constant.StickletConsts
import com.sticklet.core.model.Note
import com.sticklet.core.service.NoteService

@Service
class TrashThread {
    private static Logger logger = LoggerFactory.getLogger(TrashThread.class)

    @Autowired
    NoteService noteServ

    //@Scheduled(cron="*/5 * * * * MON-FRI")
    @Scheduled(initialDelay=1000L, fixedRate=18000000L) //every 5 hours
    public void execute() {
        if (StickletConsts.USE_TRASH) {
            List<Note> notes = noteServ.getDeletable()
            if (notes) {
                logger.debug "deleting notes: $notes"
                notes.each {
                    noteServ.deleteNote(it, true)
                }
            }
        }
    }
}
