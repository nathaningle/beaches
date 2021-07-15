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

import unittest
from ipaddress import IPv4Network

from beaches import make_net


class TestBeaches(unittest.TestCase):
    """Test suite for Beaches."""
    def test_make_net(self):
        self.assertEqual(make_net('0/0'), IPv4Network('0.0.0.0/0'))
        self.assertEqual(make_net('10/8'), IPv4Network('10.0.0.0/8'))
        self.assertEqual(make_net('172.16/16'), IPv4Network('172.16.0.0/16'))
        self.assertEqual(make_net('192.168.0/24'), IPv4Network('192.168.0.0/24'))
        self.assertEqual(make_net('10.0.0.1/32'), IPv4Network('10.0.0.1/32'))

        # Underspecified networks should fail.
        with self.assertRaises(ValueError):
            make_net('10/9')
        with self.assertRaises(ValueError):
            make_net('172.16/17')
        with self.assertRaises(ValueError):
            make_net('192.168.0/25')

        # Overspecified networks should fail.
        with self.assertRaises(ValueError):
            make_net('10/6')
        with self.assertRaises(ValueError):
            make_net('172.17/15')
        with self.assertRaises(ValueError):
            make_net('192.168.1/23')


if __name__ == '__main__':
    unittest.main(verbosity=2)
