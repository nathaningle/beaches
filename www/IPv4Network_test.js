'use strict';

QUnit.module('IPv4Network', function() {
    QUnit.test('fromOctets', function(assert) {
        assert.equal(IPv4Network.fromOctets(0, 0, 0, 0), 0x00000000, '(0, 0, 0, 0) == 0x00000000');
        assert.equal(IPv4Network.fromOctets(0, 0, 0, 1), 0x00000001, '(0, 0, 0, 1) == 0x00000001');
        assert.equal(IPv4Network.fromOctets(128, 0, 0, 0), 0x80000000, '(128, 0, 0, 0) == 0x80000000');
        assert.equal(IPv4Network.fromOctets(255, 255, 255, 254), 0xfffffffe, '(255, 255, 255, 254) == 0xfffffffe');
        assert.equal(IPv4Network.fromOctets(255, 255, 255, 255), 0xffffffff, '(255, 255, 255, 255) == 0xffffffff');
    });

    QUnit.test('toOctets', function(assert) {
        assert.deepEqual(IPv4Network.toOctets(0x00000000), [0, 0, 0, 0], '0x00000000 == [0, 0, 0, 0]');
        assert.deepEqual(IPv4Network.toOctets(0x00000001), [0, 0, 0, 1], '0x00000001 == [0, 0, 0, 1]');
        assert.deepEqual(IPv4Network.toOctets(0x80000000), [128, 0, 0, 0], '0x80000000 == [128, 0, 0, 0]');
        assert.deepEqual(IPv4Network.toOctets(0xfffffffe), [255, 255, 255, 254], '0xfffffffe == [255, 255, 255, 254]');
        assert.deepEqual(IPv4Network.toOctets(0xffffffff), [255, 255, 255, 255], '0xffffffff == [255, 255, 255, 255]');
    });

    QUnit.test('makeNetmask', function(assert) {
        assert.equal(IPv4Network.makeNetmask( 0), 0x00000000, '/0 == 0x00000000');
        assert.equal(IPv4Network.makeNetmask(16), 0xffff0000, '/16 == 0xffff0000');
        assert.equal(IPv4Network.makeNetmask(32), 0xffffffff, '/32 == 0xffffffff');
    });

    QUnit.test('hostmask', function(assert) {
        assert.equal((new IPv4Network(0,  0)).hostmask, 0xffffffff, '/0 == 0xffffffff');
        assert.equal((new IPv4Network(0, 16)).hostmask, 0x0000ffff, '/16 == 0x0000ffff');
        assert.equal((new IPv4Network(0, 32)).hostmask, 0x00000000, '/32 == 0x00000000');
    });

    QUnit.test('netmask', function(assert) {
        assert.equal((new IPv4Network(0,  0)).netmask, 0x00000000, '/0 == 0x00000000');
        assert.equal((new IPv4Network(0, 16)).netmask, 0xffff0000, '/16 == 0xffff0000');
        assert.equal((new IPv4Network(0, 32)).netmask, 0xffffffff, '/32 == 0xffffffff');
    });

    QUnit.test('broadcast', function(assert) {
        assert.equal((new IPv4Network(0x00000000,  0)).broadcast, 0xffffffff, 'broadcast 0/0 == 0xffffffff');
        assert.equal((new IPv4Network(0x0a000000,  8)).broadcast, 0x0affffff, 'broadcast 10/8 == 0x0affffff');
        assert.equal((new IPv4Network(0xac110000, 16)).broadcast, 0xac11ffff, 'broadcast 172.17/16 == 0xffff0000');
        assert.equal((new IPv4Network(0xc0a80100, 24)).broadcast, 0xc0a801ff, 'broadcast 192.168.1/24 == 0xc0a801ff');
        assert.equal((new IPv4Network(0xc0a80101, 32)).broadcast, 0xc0a80101, 'broadcast 192.168.1.1/32 == 0xc0a80101');
    });

    QUnit.test('parse 0/0', function(assert) {
        assert.deepEqual(IPv4Network.parse('0/0'), new IPv4Network(0, 0), 'Shorthand - 1 octet');
        assert.deepEqual(IPv4Network.parse('0.0/0'), new IPv4Network(0, 0), 'Shorthand - 2 octets');
        assert.deepEqual(IPv4Network.parse('0.0.0/0'), new IPv4Network(0, 0), 'Shorthand - 3 octets');
        assert.deepEqual(IPv4Network.parse('0.0.0.0/0'), new IPv4Network(0, 0), 'Longhand - 4 octets');
    });

    QUnit.test('parse 172.17/16', function(assert) {
        assert.deepEqual(IPv4Network.parse('172.17/16'), new IPv4Network(0xac110000, 16), 'Shorthand - 2 octets');
        assert.deepEqual(IPv4Network.parse('172.17.0/16'), new IPv4Network(0xac110000, 16), 'Shorthand - 3 octets');
        assert.deepEqual(IPv4Network.parse('172.17.0.0/16'), new IPv4Network(0xac110000, 16), 'Longhand - 4 octets');
    });

    QUnit.test('parse 255.255.255.255/32', function(assert) {
        assert.deepEqual(IPv4Network.parse('255.255.255.255/32'), new IPv4Network(0xffffffff, 32));
    });

    QUnit.test('parse hosts', function(assert) {
        assert.deepEqual(IPv4Network.parse('0.0.0.0'), new IPv4Network(0x00000000, 32));
        assert.deepEqual(IPv4Network.parse('192.168.1.1'), new IPv4Network(0xc0a80101, 32));
        assert.deepEqual(IPv4Network.parse('255.255.255.255'), new IPv4Network(0xffffffff, 32));
    });

    QUnit.test('parse hosts with whitespace', function(assert) {
        assert.deepEqual(IPv4Network.parse('    0.0.0.0'), new IPv4Network(0x00000000, 32));
        assert.deepEqual(IPv4Network.parse('192.168.1.1    '), new IPv4Network(0xc0a80101, 32));
        assert.deepEqual(IPv4Network.parse('  255.255.255.255  '), new IPv4Network(0xffffffff, 32));
    });

    QUnit.test('parse fail with host bits set', function(assert) {
        assert.throws(function() { IPv4Network.parse('172.17/15') });
    });

    QUnit.test('parse fail with underdefined network bits', function(assert) {
        assert.throws(function() { IPv4Network.parse('10/9') });
        assert.throws(function() { IPv4Network.parse('172.17/17') });
        assert.throws(function() { IPv4Network.parse('192.168.1/25') });
    });

    QUnit.test('coalesce', function(assert) {
        assert.deepEqual(
            IPv4Network.coalesce([]),
            [],
            'Empty'
        );

        assert.deepEqual(
            IPv4Network.coalesce(['0/0'].map(IPv4Network.parse)),
            [new IPv4Network(0, 0)],
            'Singleton (0/0)'
        );

        assert.deepEqual(
            IPv4Network.coalesce(['192.168.1/24'].map(IPv4Network.parse)),
            [IPv4Network.parse('192.168.1/24')],
            'Singleton (192.168.1/24)'
        );

        assert.deepEqual(
            IPv4Network.coalesce(['255.255.255.255/32'].map(IPv4Network.parse)),
            [IPv4Network.parse('255.255.255.255/32')],
            'Singleton (255.255.255.255/32)'
        );

        assert.deepEqual(
            IPv4Network.coalesce(['0/1', '128/1'].map(IPv4Network.parse)),
            [new IPv4Network(0, 0)],
            'Join 2 adjacent nets'
        );

        assert.deepEqual(
            IPv4Network.coalesce(['0/0', '192.168.0/24'].map(IPv4Network.parse)),
            [new IPv4Network(0, 0)],
            'Remove shadowed nets'
        );

        assert.deepEqual(
            IPv4Network.coalesce(['10.0.0/24', '10.0.1/24', '10.0.2/24', '10.0.3/24'].map(IPv4Network.parse)),
            [new IPv4Network(0x0a000000, 22)],
            'Join 4 adjacent nets (in order)'
        );

        assert.deepEqual(
            IPv4Network.coalesce(['10.0.2/24', '10.0.1/24', '10.0.0/24', '10.0.3/24'].map(IPv4Network.parse)),
            [new IPv4Network(0x0a000000, 22)],
            'Join 4 adjacent nets (out of order)'
        );

        assert.deepEqual(
            IPv4Network.coalesce(['10.0.2/24', '10.0.1/24', '192.168.1.128/25', '10.0.0/24', '10.0.3/24'].map(IPv4Network.parse)),
            [new IPv4Network(0x0a000000, 22), IPv4Network.parse('192.168.1.128/25')],
            'Join 4 adjacent nets (out of order) and keep an unrelated net'
        );

        assert.deepEqual(
            IPv4Network.coalesce(['0/1', '128/3', '160/3', '192/3', '224/3'].map(IPv4Network.parse)),
            [new IPv4Network(0, 0)],
            'Join 1 big net with 4 little ones'
        );

        assert.deepEqual(
            IPv4Network.coalesce(['0/3', '32/3', '64/3', '96/3', '128/1'].map(IPv4Network.parse)),
            [new IPv4Network(0, 0)],
            'Join 4 little nets with 1 big one'
        );
    });
});
