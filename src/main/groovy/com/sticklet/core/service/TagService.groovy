package com.sticklet.core.service

import javax.servlet.http.HttpServletResponse

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Service

import com.sticklet.core.model.Tag
import com.sticklet.core.model.User
import com.sticklet.core.repository.TagRepo

@Service
class TagService {
    @Autowired
    private TagRepo tagRepo
    @Autowired
    private ResponseStatusService statusServ

    public List<Tag> getTagsByUser(User user) {
        tagRepo.findAllByUser(user)
    }

    public Tag createTag(User user, String name) {
        Tag tag = new Tag(["user": user, "name": name])
        tagRepo.save(tag)
    }
    
    public Tag findTag(User user, String name) {
        tagRepo.findByNameAndUser(name, user)
    }

    public Tag getTag(String tagID, User user, HttpServletResponse resp) {
        Tag tag = tagRepo.findOne(tagID)
        if (tag) {
            if (userHasAccess(tag, user)) {
                return tag
            } else {
                statusServ.setStatusUnauthorized(resp)
            }
        } else {
            statusServ.setStatusNotFound(resp)
        }
        return null
    }

    public void deleteTag(Tag tag) {
        tagRepo.delete(tag)
    }

    public static boolean userHasAccess(Tag tag, User user) {
        tag && user && tag.user.id == user.id
    }
}