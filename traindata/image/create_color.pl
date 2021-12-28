#!/usr/bin/perl
#
use strict;
use warnings;

my $num = shift // 205;
my $size = shift // 1;

for my $c ("red", "green", "blue", "gray") {
	system("mkdir -p color/$c");
	for my $n (1 .. $num) {
		my $x = int(rand(100) + 155);
		my $h = sprintf("%X", $x);

		my $other_1 = int(rand(30));
		my $other_1_hex = sprintf("%.02X", $other_1);
		my $other_2 = int(rand(30));
		my $other_2_hex = sprintf("%.02X", $other_2);

		my $color = undef;
		if($c eq "blue") {
			$color = "$other_1_hex$other_2_hex$h";
		} elsif ($c eq "red") {
			$color = "${h}$other_1_hex$other_2_hex";
		} elsif ($c eq "green") {
			$color = "$other_1_hex${h}$other_2_hex";
		} elsif ($c eq "gray") {
			$x = int(rand(255));
			$h = sprintf("%X", $x);
			$color = $h x 3;
		}

		my $command = "convert -size ${size}x$size xc:#$color color/$c/$n.png";
		print "$command\n";
		system $command;
	}
}
