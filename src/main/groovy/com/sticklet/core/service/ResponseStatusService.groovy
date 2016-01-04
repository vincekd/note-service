package com.sticklet.core.service

import javax.servlet.http.HttpServletResponse

import org.springframework.stereotype.Service

@Service
class ResponseStatusService {
    public void setStatusBadRequest(HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_BAD_REQUEST)
    }
    public void setStatusUnauthorized(HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED)
    }
    public void setStatusNotFound(HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_NOT_FOUND)
    }
    public void setStatusConflict(HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_CONFLICT)
    }
    public void setStatusError(HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR)
    }
    public void setStatusCreated(HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_CREATED)
    }
    public void setStatusOK(HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_OK)
    }
}