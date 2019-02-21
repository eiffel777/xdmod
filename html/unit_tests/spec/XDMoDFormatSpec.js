describe('XDMoD.Format', function () {
    describe('Check Format functions', function () {
        it('SI formatting', function () {
            var test_cases = [
                [100001, 'B', 3, '100 kB'],
                [10100001, 'B', 3, '10.1 MB'],
                [0.0001, 'B', 2, '0.00010 B'],
                [0.00033, 'B', 2, '0.00033 B'],
                [1.00001, 'B', 1, '1 B'],
                [1, '', 2, '1.0 '],
                [10, '', 2, '10 '],
                [100, '', 2, '1.0e+2 '],
                [1000, '', 2, '1.0e+3 '],
                [10000, '', 2, '10 k'],
                [100000, '', 2, '1.0e+2 k'],
                [1000000, '', 2, '1.0e+3 k'],
                [10000000, '', 2, '10 M'],
                [100000000, '', 2, '1.0e+2 M'],
                [1000000000, '', 2, '1.0e+3 M'],
                [9, '', 2, '9.0 '],
                [99, '', 2, '99 '],
                [999, '', 2, '1.0e+3 '],
                [9999, '', 2, '10 k'],
                [99999, '', 2, '1.0e+2 k'],
                [999999, '', 2, '1.0e+3 k'],
                [9999999, '', 2, '10 M'],
                [99999999, '', 2, '1.0e+2 M'],
                [999999999, '', 2, '1.0e+3 M'],
                [9999999999, '', 2, '10 G']
            ];

            var i;
            for (i = 0; i < test_cases.length; i++) {
                expect(XDMoD.utils.format.convertToSiPrefix(test_cases[i][0], test_cases[i][1], test_cases[i][2])).to.equal(test_cases[i][3]);
            }
        });

        it('Binary formatting', function () {
            var test_cases = [
                [1025, 'B', 3, '1.00 KiB'],
                [10100001, 'B', 3, '9.63 MiB'],
                [0.0001, 'B', 2, '0.00010 B'],
                [1.00001, 'B', 1, '1 B']
            ];

            var i;
            for (i = 0; i < test_cases.length; i++) {
                expect(XDMoD.utils.format.convertToBinaryPrefix(test_cases[i][0], test_cases[i][1], test_cases[i][2])).to.equal(test_cases[i][3]);
            }
        });

        it('Elapsed time', function () {
            var test_cases = [
                [1, '1 second '],
                [2, '2 seconds '],
                [3600, '1 hour 0.0 minute '],
                [3601, '1 hour 0.0 minute '],
                [3600 + (5 * 60), '1 hour 5.0 minutes '],
                [24 * 3600, '1 day 0.0 hour '],
                [(3 * 24 * 3600) + 3600, '3 days 1.0 hour ']
            ];

            var i;
            for (i = 0; i < test_cases.length; i++) {
                expect(XDMoD.utils.format.humanTime(test_cases[i][0])).to.equal(test_cases[i][1]);
            }
        });
    });
});
