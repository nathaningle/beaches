#!/usr/bin/env python
#
# ISC License
#
# Copyright (c) 2021, Nathan Ingle
#
# Permission to use, copy, modify, and/or distribute this software for any
# purpose with or without fee is hereby granted, provided that the above
# copyright notice and this permission notice appear in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
# WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
# MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
# ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
# WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
# ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
# OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

import ipaddress
from ipaddress import IPv4Network, collapse_addresses
import re
from urllib.parse import parse_qs


# Regex patterns for shorthand IPv4 addresses having 1, 2 or 3 octets.
p_1o = re.compile('^(\d{1,3})/(\d)$')
p_2o = re.compile('^(\d{1,3})\.(\d{1,3})/(\d{1,2})$')
p_3o = re.compile('^(\d{1,3})\.(\d{1,3})\.(\d{1,3})/(\d{1,2})$')


def make_net(s: str) -> IPv4Network:
    """Construct an ipaddress.IPv4Network from a string.

    Accepts shorthand IPv4 addresses e.g. 10/8.
    """

    m = p_1o.match(s)
    if m:
        masklen = int(m.group(2))
        if masklen > 8:
            raise ValueError('Network bits of %s are underspecified' % m.group(0))
        ipstr = '{}.0.0.0/{}'.format(m.group(1), m.group(2))
        return ipaddress.IPv4Network(ipstr)

    m = p_2o.match(s)
    if m:
        masklen = int(m.group(3))
        if masklen > 16:
            raise ValueError('Network bits of %s are underspecified' % m.group(0))
        ipstr = '{}.{}.0.0/{}'.format(m.group(1), m.group(2), m.group(3))
        return ipaddress.IPv4Network(ipstr)

    m = p_3o.match(s)
    if m:
        masklen = int(m.group(4))
        if masklen > 24:
            raise ValueError('Network bits of %s are underspecified' % m.group(0))
        ipstr = '{}.{}.{}.0/{}'.format(m.group(1), m.group(2), m.group(3), m.group(4))
        return ipaddress.IPv4Network(ipstr)

    return ipaddress.IPv4Network(s)


def app_form(environ, start_response):
    """WSGI sub-app that serves a HTML form for demonstration purposes."""

    if environ['PATH_INFO'] != '/':
        errmsg = b'Page Not Found\n'
        status = '404 Not Found'
        response_headers = [('Content-Type', 'text/plain; charset=utf-8'), ('Content-Length', str(len(errmsg)))]
        start_response(status, response_headers)
        return [errmsg]

    htmlform = b'''<!DOCTYPE html><meta charset="utf-8"><title>Demo</title>
<style>textarea { width: 16em; height: 20ex; display: block; margin: 1em; }</style>
<link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAJ0lEQVQI12Nsev6DARtgYsABcEqwHN3fgV1C4N8XrBKM3+/2UMlyAEz3COI5wFJCAAAAAElFTkSuQmCC">
<form method="post">
<label for="nets">Enter IPv4 subnets (e.g. 192.168.1/24), one per line:</label>
<textarea id="nets" name="nets">192.168.1/24</textarea>
<input type="submit" value="Submit">
</form>
'''
    status = '200 OK'
    response_headers = [('Content-Type', 'text/html; charset=utf-8'), ('Content-Length', str(len(htmlform)))]
    start_response(status, response_headers)
    return [htmlform]


def application(environ, start_response):
    """Main WSGI app"""

    if environ['REQUEST_METHOD'] == 'GET':
        return app_form(environ, start_response)
    if environ['REQUEST_METHOD'] != 'POST':
        errmsg = b'Method Not Allowed\nTry POSTing a list of IPv4 subnets (e.g. 10/8), one per line, with key "nets".'
        status = '405 Method Not Allowed'
        response_headers = [('Content-Type', 'text/plain; charset=utf-8'), ('Content-Length', str(len(errmsg)))]
        start_response(status, response_headers)
        return [errmsg]

    request_body_size = int(environ.get('CONTENT_LENGTH', 0))
    request_body = environ['wsgi.input'].read(request_body_size)

    textbox_content = parse_qs(request_body).get(b'nets', [b''])[0].decode()
    try:
        nets = [make_net(s) for s in textbox_content.split()]
    except ValueError as e:
        errmsg = str(e).encode()
        status = '400 Bad Request'
        response_headers = [('Content-Type', 'text/plain'), ('Content-Length', str(len(errmsg)))]
        start_response(status, response_headers)
        return [errmsg]

    response_body = "\r\n".join(str(net) for net in collapse_addresses(nets)).encode() + b"\r\n"
    status = '200 OK'
    response_headers = [('Content-Type', 'text/plain; charset=utf-8'), ('Content-Length', str(len(response_body)))]
    start_response(status, response_headers)
    return [response_body]


if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    srv = make_server('localhost', 8080, application)
    srv.serve_forever()
