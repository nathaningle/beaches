'use strict';

const ALL_ONES = 0xffffffff;

const IPv4NETWORK_PATTERN_1OCT = /^(\d+)\/(\d+)$/;
const IPv4NETWORK_PATTERN_2OCT = /^(\d+)\.(\d+)\/(\d+)$/;
const IPv4NETWORK_PATTERN_3OCT = /^(\d+)\.(\d+)\.(\d+)\/(\d+)$/;
const IPv4NETWORK_PATTERN_4OCT = /^(\d+)\.(\d+)\.(\d+)\.(\d+)\/(\d+)$/;
const IPv4NETWORK_PATTERN_MASK = /^(\d+)\.(\d+)\.(\d+)\.(\d+)\D{1,5}(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
const IPv4NETWORK_PATTERN_HOST = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;

function isLsbSet(x) {
    return (x & 1) === 1;
}

class IPv4Network {
    // PROTIP: '>>>' works with 32-bit unsigned ints; other JavaScript bitwise operators work with signed ints.

    constructor(netaddr, masklen) {
        if (masklen < 0 || masklen > 32)
            throw new Error('masklen out of range: ' + masklen.toString() + ' (must be 0-32)');

        this.netaddr = netaddr;
        this.masklen = masklen;

        if ((netaddr & this.hostmask) !== 0)
            throw new Error('host bits set: ' + this.toString());
    }

    toString() {
        return this.octets.join('.') + '/' + this.masklen.toString();
    }

    get hostmask() {
        if (this.masklen === 32)
            return 0;
        return ALL_ONES >>> this.masklen;
    }

    get netmask() {
        return (~this.hostmask) >>> 0;
    }

    get broadcast() {
        return (this.netaddr | (ALL_ONES & this.hostmask)) >>> 0;
    }

    get octets() {
        return IPv4Network.toOctets(this.netaddr);
    }

    // True iff that object refers to the same subnet as this.
    isEqualTo(that) {
        return this.netaddr === that.netaddr && this.masklen === that.masklen;
    }

    // True iff that subnet falls within this one.
    includes(that) {
        return this.netaddr <= that.netaddr && this.broadcast >= that.broadcast;
    }

    // Create a new IPv4Address having masklen no longer than new_masklen.
    clampMasklen(new_masklen) {
        if (this.masklen <= new_masklen)
            return new IPv4Network(this.netaddr, this.masklen);

        const newMask = IPv4Network.makeNetmask(new_masklen);
        return new IPv4Network((this.netaddr & newMask) >>> 0, new_masklen);
    }

    supernet() {
        if (this.masklen === 0)
            throw new Error('unable to make a supernet for ' + this.toString());

        const super_mask = (this.netmask << 1) >>> 0;
        return new IPv4Network((this.netaddr & super_mask) >>> 0, this.masklen - 1);
    }

    // Make an unsigned 32-bit integer from 4 octets.
    static fromOctets(a, b, c, d) {
        for (const x of [a, b, c, d]) {
            if (x < 0 || x > 255)
                throw new Error('octet out of range: ' + x.toString() + ' (must be 0-255)');
        }

        return (a << 24 | b << 16 | c << 8 | d) >>> 0;
    }

    // Break an unsigned 32-bit integer into 4 octets.
    static toOctets(x) {
        return [
            (x >>> 24) & 0xff,
            (x >>> 16) & 0xff,
            (x >>>  8) & 0xff,
             x         & 0xff
        ];
    }

    // Calculate the netmask length of an unsigned 32-bit integer mask.
    static toMasklen(mask) {
        if (mask === ALL_ONES) return 32;

        // If LSB is not set, treat this as a netmask.
        if (!isLsbSet(mask)) return IPv4Network.toMasklen(~mask);

        // LSB is set; treat this as a hostmask.
        let masklen = 0;
        let x = mask;

        do {
            x >>>= 1;
            masklen++;
        } while (isLsbSet(x));

        if (x !== 0)
            throw new Error('non-contiguous mask: ' + IPv4Network.toOctets(mask).join('.'));

        return 32 - masklen;
    }

    // Make a 32-bin unsigned integer network mask from a mask length.
    static makeNetmask(masklen) {
        if (masklen < 0 || masklen > 32)
            throw new Error('mask length out of range: ' + masklen.toString() + ' (must be 0-32)');
        if (masklen == 0)
            return 0;

        return (ALL_ONES << (32 - masklen)) >>> 0;
    }

    static parse(s) {
        let m = s.match(IPv4NETWORK_PATTERN_1OCT);
        if (m) {
            let [a, masklen] = m.slice(1).map(x => parseInt(x));
            if (masklen > 8)
                throw new Error('network bits of ' + s + ' are underspecified');
            return new IPv4Network(IPv4Network.fromOctets(a, 0, 0, 0), masklen);
        }

        m = s.match(IPv4NETWORK_PATTERN_2OCT);
        if (m) {
            let [a, b, masklen] = m.slice(1).map(x => parseInt(x));
            if (masklen > 16)
                throw new Error('network bits of ' + s + ' are underspecified');
            return new IPv4Network(IPv4Network.fromOctets(a, b, 0, 0), masklen);
        }

        m = s.match(IPv4NETWORK_PATTERN_3OCT);
        if (m) {
            let [a, b, c, masklen] = m.slice(1).map(x => parseInt(x));
            if (masklen > 24)
                throw new Error('network bits of ' + s + ' are underspecified');
            return new IPv4Network(IPv4Network.fromOctets(a, b, c, 0), masklen);
        }

        m = s.match(IPv4NETWORK_PATTERN_4OCT);
        if (m) {
            let [a, b, c, d, masklen] = m.slice(1).map(x => parseInt(x));
            return new IPv4Network(IPv4Network.fromOctets(a, b, c, d), masklen);
        }

        m = s.match(IPv4NETWORK_PATTERN_MASK);
        if (m) {
            let [a, b, c, d, e, f, g, h, masklen] = m.slice(1).map(x => parseInt(x));
            return new IPv4Network(IPv4Network.fromOctets(a, b, c, d), IPv4Network.toMasklen(IPv4Network.fromOctets(e, f, g, h)));
        }

        m = s.match(IPv4NETWORK_PATTERN_HOST);
        if (m) {
            let [a, b, c, d] = m.slice(1).map(x => parseInt(x));
            return new IPv4Network(IPv4Network.fromOctets(a, b, c, d), 32);
        }

        throw new Error('"' + s + '" is not an IPv4 subnet (must look like e.g. 192.0.2/24)');
    }

    static coalesce(nets) {
        let seen_stack = [];

        // Sort the not-seen stack, in descending order, by network address, with mask length as
        // tiebreaker.  This means that notseen_stack.pop() returns the subnet closest to 0/0.
        let notseen_stack = nets;
        notseen_stack.sort((a, b) => a.netaddr !== b.netaddr ? b.netaddr - a.netaddr : b.masklen - a.masklen);

        // Try to combine the greatest subnet from the seen stack and the least subnet from the
        // not-seen stack.
        while (notseen_stack.length > 0) {
            let a = seen_stack.pop();
            let b = notseen_stack.pop();

            if (!a) {
                seen_stack.push(b);
            } else if (a.includes(b)) {
                seen_stack.push(a);
            } else if (a.supernet().isEqualTo(b.supernet())) {
                notseen_stack.push(a.supernet());
            } else {
                seen_stack.push(a);
                seen_stack.push(b);
            }
        }
        return seen_stack;
    }
}
