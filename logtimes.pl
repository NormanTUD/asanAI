#!/usr/bin/perl
$|++;
use strict;
use warnings;
use POSIX qw/strftime/;
use Git::Repository;
use Text::CSV;
use DateTime;
use DateTime::Format::Strptime;
use Date::Calc qw/Day_of_Week Days_in_Month/;
use Date::Holidays;
use Data::Dumper;
use Term::ANSIColor;
use Text::Table;

my %month_names = (
	1 => "Januar",
	2 => "Februar",
	3 => "März",
	4 => "April",
	5 => "Mai",
	6 => "Juni",
	7 => "Juli",
	8 => "August",
	9 => "September",
	10 => "Oktober",
	11 => "November",
	12 => "Dezember"
);

sub dier {
	die Dumper \@_;
}

# Set the Git repository paths from the ~/.repos file
my $repos_file = "$ENV{HOME}/.repos";
open my $repos_fh, '<', $repos_file or die "Could not open $repos_file: $!";
my @repos = <$repos_fh>;
chomp(@repos);

# Define the date range
my $start_date = shift || die("No start date given");

my $start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);
my $original_start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);
my $end_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);
$end_time->add(months => 1);

if (!$end_time) {
	die("End time could not be found. Is it above the max number of days per month?");
}

# Create a CSV object for writing timetable.csv
my $csv_timetable = Text::CSV->new({ binary => 1, eol => $/ });
open my $timetable_fh, '>', 'timetable.csv' or die "Could not open timetable.csv: $!";
$csv_timetable->print($timetable_fh, ['tag', 'uhrzeit_erster_commit', 'uhrzeit_letzter_commit']);

# Create a CSV object for writing table2.csv
my $csv_table2 = Text::CSV->new({ binary => 1, eol => $/ });
open my $table2_fh, '>', 'table2.csv' or die "Could not open table2.csv: $!";
$csv_table2->print($table2_fh, ['tag', 'arbeitszeit', 'anzahl_commits_an_dem_tag', 'erster_commit', 'letzter_commit']);

my $pause_threshold = 3600;

# Initialize total working hours and commits count
my $total_working_hours = 0;
my $total_pauses = 0;

my $total_commits_count = 0;

# Initialize Gnuplot data arrays
my @plot_dates;
my @plot_commits;

my %global_working_hours = ();
my %global_pause_times = ();

# Determine holidays (in this case, for Germany)
my $holidays = Date::Holidays->new(
	countrycode => 'DE',
	nocheck    => 1,
	WHERE => ['common', 'sn']
);

# Iterate through each day in the date range
while ($start_time <= $end_time) {
	my $current_date = $start_time->strftime('%Y-%m-%d');
	my $strp = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d');
	my $end_of_day = $start_time->clone()->set(hour => 23, minute => 59, second => 59);

	my @all_commits = ();

	foreach my $repo_path (@repos) {
		print "\b\b\b" x 200;
		print " " x 200;
		print "\b\b\b" x 200;
		print scalar(@all_commits)." commits found for $start_time -> $repo_path";
		my $repo = Git::Repository->new(work_tree => $repo_path);
		my @commits = $repo->run('log', '--date=local', '--pretty=%at,%h', "--since=$start_time", "--until=$end_of_day");

		push @all_commits, @commits;
		@all_commits = sort @all_commits;
	}

	if (@all_commits) {
		#@all_commits = reverse @all_commits;
		my @commit_times;
		my @commit_times_full;
		my @commit_hashes;
		my $commits_count = 0;

		foreach my $commit (@all_commits) {
			my ($timestamp, $hash) = split(/,/, $commit);
			my $commit_time = DateTime->from_epoch(epoch => $timestamp);
			push @commit_times, $commit_time->strftime('%H:%M');
			push @commit_times_full, $commit_time->strftime('%Y-%m-%d %H:%M:%S');
			push @commit_hashes, $hash;
			$commits_count++;
		}

		my $format = DateTime::Format::Strptime->new(
			pattern => '%Y-%m-%d %H:%M:%S',
			on_error => 'croak',
		);

		@all_commits = sort { (split(/,/, $a))[0] <=> (split(/,/, $b))[0] } @all_commits;

		my $prev_commit_time = (split /,/, $all_commits[0])[0];

		my $current_pause_duration = 0;

		my $current_day_pause_time = 0;

		foreach my $commit (@all_commits) {
			my ($timestamp, $hash) = split(/,/, $commit);
			my $commit_time = $timestamp;

			# Check if this is the first commit, or the time gap is more than the pause threshold
			if (($commit_time - $prev_commit_time) >= $pause_threshold) {
				if ($current_pause_duration > 0) {
					# Log the pause duration and reset the pause timer
					print("pause duration: $current_pause_duration\n");
					$current_pause_duration = 0;
				}
			} else {
				# Accumulate the time as working time
				$current_pause_duration += ($commit_time - $prev_commit_time);
				$current_day_pause_time += ($commit_time - $prev_commit_time);
			}

			$prev_commit_time = $commit_time;
		}

		my $first_commit_time = $commit_times[0];
		my $first_commit_time_full = $format->parse_datetime($commit_times_full[0]);
		my $first_commit_hash = $commit_hashes[0];

		my $last_commit_time = $commit_times[-1];
		my $last_commit_time_full = $format->parse_datetime($commit_times_full[-1]);
		my $last_commit_hash = $commit_hashes[-1];

		my $working_hours = $last_commit_time_full->subtract_datetime($first_commit_time_full);
		my $working_hours_formatted = $working_hours->hours . ':' . sprintf("%02d", $working_hours->minutes);

		$global_working_hours{$current_date} = $working_hours_formatted;
		$global_pause_times{$current_date} = $current_day_pause_time;

		$total_working_hours += abs($working_hours->in_units('hours'));
		$total_commits_count += $commits_count;

		$csv_timetable->print($timetable_fh, [$current_date, $first_commit_time, $last_commit_time]);
		$csv_table2->print($table2_fh, [$current_date, $working_hours_formatted, $commits_count, $first_commit_hash, $last_commit_hash]);

		push @plot_dates, $current_date;
		push @plot_commits, $commits_count;

	}

	$start_time->add(days => 1);
}

sub log_message {
	my ($message) = @_;
	print "Log: $message\n";
}

sub log_pause {
	my ($date, $duration) = @_;
	my $hours = int($duration / 3600);
	my $minutes = int(($duration % 3600) / 60);
	my $formatted_duration = "$hours hours $minutes minutes";

	# Log the pause duration
	log_message("Pause detected on $date: $formatted_duration");
}

close $timetable_fh;
close $table2_fh;

# Define the year and month
my $current_year = $original_start_time->year;
my $current_month = $original_start_time->month;

print "\n\n".colored($month_names{$current_month}, 'on_magenta bold')."\n\n";

# Clean up temporary files
unlink 'timetable.csv';
unlink 'table2.csv';

# Create a hash of workdays
my %workdays = ();
my %pause_times = ();

# Iterate through each day in the month

while ($current_month == $original_start_time->month) {
	my $day = $original_start_time->day;
	my $current_date = $original_start_time->strftime('%Y-%m-%d');
	my $current_month = $original_start_time->strftime('%m');
	my $current_year = $original_start_time->strftime('%Y');
	my $day_of_week = Day_of_Week($current_year, $current_month, $day);

	my $dh = Date::Holidays->new(
		countrycode => 'de'
	);

	my $is_holiday = $dh->is_holiday(
		year      => $current_year,
		month     => $current_month,
		day       => $day,
		regions => ['common', 'sn'],
	);

	# Check if it's a weekend (Saturday or Sunday)
	if ($day_of_week == 6 || $day_of_week == 7) {
		$workdays{$current_date} = 'WEEKEND';
	} elsif ($is_holiday) {
		# Check if it's a holiday
		$workdays{$current_date} = 'HOLIDAY';
	} else {
		# Check for overtime or undertime (assuming 8 hours per day is normal)
		my $working_hours = $global_working_hours{$current_date};
		if ($working_hours) {
			my ($hours, $minutes) = split(':', $working_hours);
			my $total_minutes = $hours * 60 + $minutes;
			if ($total_minutes > 8 * 60) {
				$workdays{$current_date} = 'OVERTIME';
			} elsif ($total_minutes < 8 * 60) {
				$workdays{$current_date} = 'UNDERTIME';
			}
		}

		my $pause_time = $global_pause_times{$current_date};

		if ($pause_time) { # in seconds
			my $min_pause_time = 1800;

			$pause_times{$current_date} = parse_duration($pause_time);
		}
	}

	$original_start_time->add(days => 1);
}

sub parse_duration {
	my $seconds = shift;
	my $hours = int( $seconds / (60*60) );
	my $mins = ( $seconds / 60 ) % 60;
	my $secs = $seconds % 60;
	return sprintf("%02d:%02d:%02d", $hours,$mins,$secs);
}

# Reinitialize the start time for printing the calendar
$original_start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);

# Create a table for displaying the calendar
my $table = Text::Table->new('DOM, ', 'Day, ', 'Working Hours', "Pauses");
my @weekend_days;
my $number_workdays = 0;

while ($current_month == $original_start_time->month) {
	my $day = $original_start_time->day;
	my $current_date = $original_start_time->strftime('%Y-%m-%d');
	my $day_of_week = Day_of_Week($current_year, $current_month, $day);

	my $color = 'reset';

	# Determine the color based on workday type
	if (exists $workdays{$current_date}) {
		if ($workdays{$current_date} eq 'WEEKEND') {
			$color = 'green';
			push @weekend_days, [$day, $global_working_hours{$current_date} || '0:00'];
		} elsif ($workdays{$current_date} eq 'HOLIDAY') {
			$color = 'on_blue';
		} else {
			if ($workdays{$current_date} eq 'OVERTIME') {
				$color = 'on_green';
			} elsif ($workdays{$current_date} eq 'UNDERTIME') {
				$color = 'on_red';
			}
		}
	}

	my $pause_col = "";
	if(exists $pause_times{$current_date}) {
		$pause_col = $pause_times{$current_date};
		if($pause_col < 1800) {
			if(!$workdays{$current_date} eq 'WEEKEND' && $workdays{$current_date} eq 'HOLIDAY') {
				$pause_col = colored($pause_col, "red");
			}
		}
	}

	# Calculate the working hours for the day
	my $working_hours = $global_working_hours{$current_date} || '0:00';

	my @dow_to_d = qw/So Mo Di Mi Do Fr Sa Sa/;

	my $dow = $dow_to_d[$day_of_week];

	if(($dow eq "So" || $dow eq "Sa") && $workday{$current_date} ne "HOLIDAY") {
		$dow = colored($dow, "on_green");
	}

	my $colored_text = colored($working_hours, $color);

	if($dow =~ m#^S[ao]$#) {
		$colored_text = colored($colored_text, "underline");
	} else {
		if(($color ne 'on_blue' && $color ne 'green') || $color ne "reset") {
			$number_workdays++;
		}
	}

	# Add day and working hours to the table
	$table->add($day, $dow, $colored_text, $pause_col);

	# Increment the day
	$original_start_time->add(days => 1);
}

my $expected_working_hours = $number_workdays * 8;

# Output total working hours and commits count

print " " x 100;
print "\b\b\b" x 100;
print " " x 100;
print "\b\b\b" x 100;

print "Work days: $number_workdays\n";
print "Expected working hours: $expected_working_hours hours\n";
print "Total Working Hours: $total_working_hours hours\n";
my $over_or_undertime = abs($expected_working_hours) - abs($total_working_hours);

if($expected_working_hours <= $total_working_hours) {
	print "Overtime ".abs($over_or_undertime)." hours\n";
} else {
	print "Undertime ".abs($over_or_undertime)." hours\n";
}

print "Total Commits Count: $total_commits_count\n";

# Print any remaining days at the end of the month
if ($table->body() || @weekend_days) {
	print "\n";
	print colored(colored("Wochenende", "green"), "underline")."\n";
	print colored("Feiertag", "on_blue")."\n";
	print colored("Überstunden", "on_green")."\n";
	print colored("Unterstunden", "on_red")."\n";
	print colored("Wochenende", "underline")."\n";
	print $table;
	print "\n";
}
