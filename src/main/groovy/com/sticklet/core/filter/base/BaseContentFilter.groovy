package com.sticklet.core.filter.base

import javax.servlet.Filter
import javax.servlet.ServletOutputStream
import javax.servlet.WriteListener
import javax.servlet.http.HttpServletResponse
import javax.servlet.http.HttpServletResponseWrapper

interface BaseContentFilter extends Filter {
    protected static final class ByteArrayServletStream extends ServletOutputStream {
        ByteArrayOutputStream baos
        WriteListener writeListener

        ByteArrayServletStream(ByteArrayOutputStream baos) {
            this.baos = baos
        }

        public void write(int param) {
            baos.write(param)
        }
        public void setWriteListener(WriteListener wl) {
            writeListener = wl
        }
        public boolean isReady() {
            true
        }
    }

    protected static final class ByteArrayPrintWriter {

        private ByteArrayOutputStream baos = new ByteArrayOutputStream()
        private PrintWriter pw = new PrintWriter(baos)
        private ServletOutputStream sos = new ByteArrayServletStream(baos)

        public PrintWriter getWriter() {
            pw
        }

        public ServletOutputStream getStream() {
            sos
        }

        public byte[] toByteArray() {
            baos.toByteArray()
        }
    }

    protected static final class CharResponseWrapper extends HttpServletResponseWrapper {
        private ByteArrayPrintWriter output
        private boolean usingWriter

        public CharResponseWrapper(HttpServletResponse response) {
            super(response)
            usingWriter = false
            output = new ByteArrayPrintWriter()
        }

        public byte[] getByteArray() {
            output.toByteArray()
        }

        @Override
        public ServletOutputStream getOutputStream() {
            // will error out, if in use
            if (usingWriter) {
                super.getOutputStream()
            }
            usingWriter = true
            output.getStream()
        }

        @Override
        public PrintWriter getWriter() {
            // will error out, if in use
            if (usingWriter) {
                super.getWriter()
            }
            usingWriter = true
            output.getWriter()
        }

        public String toString() {
            return output.toString()
        }
    }
} 