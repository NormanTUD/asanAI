#!/usr/bin/perl
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

sub dier {
    die Dumper \@_;
}

# Set the Git repository path
my $repo_path = '.';

# Define the date range
my $start_date = shift || '2022-01-01';
my $end_date = shift || '2022-12-31';

my $start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);
my $original_start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);
my $end_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($end_date);

if(!$end_time) {
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

# Initialize total working hours and commits count
my $total_working_hours = 0;
my $total_commits_count = 0;

# Initialize Gnuplot data arrays
my @plot_dates;
my @plot_commits;

my %global_working_hours = ();

# Determine holidays (in this case, for Germany)
my $holidays = Date::Holidays->new(
    countrycode => 'DE',
    nocheck    => 1,
    WHERE=>['common', 'sn']
);

# Iterate through each day in the date range
while ($start_time <= $end_time) {
    my $current_date = $start_time->strftime('%Y-%m-%d');
    my $strp = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d');
    my $end_of_day = $start_time->clone()->set(hour => 23, minute => 59, second => 59);

    my $repo = Git::Repository->new(work_tree => $repo_path);
    my @commits = $repo->run('log', '--date=local', '--pretty=%at,%h', "--since=$start_time", "--until=$end_of_day");

    if (@commits) {
        @commits = reverse @commits;
        my @commit_times;
        my @commit_times_full;
        my @commit_hashes;
        my $commits_count = 0;

        foreach my $commit (@commits) {
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

        my $first_commit_time = $commit_times[0];
        my $first_commit_time_full = $format->parse_datetime($commit_times_full[0]);
        my $first_commit_hash = $commit_hashes[0];

        my $last_commit_time = $commit_times[-1];
        my $last_commit_time_full = $format->parse_datetime($commit_times_full[-1]);
        my $last_commit_hash = $commit_hashes[-1];

        my $working_hours = $last_commit_time_full->subtract_datetime($first_commit_time_full);
        my $working_hours_formatted = $working_hours->hours . ':' . sprintf("%02d", $working_hours->minutes);

        $global_working_hours{$current_date} = $working_hours_formatted;

        $total_working_hours += $working_hours->in_units('hours');
        $total_commits_count += $commits_count;

        $csv_timetable->print($timetable_fh, [$current_date, $first_commit_time, $last_commit_time]);
        $csv_table2->print($table2_fh, [$current_date, $working_hours_formatted, $commits_count, $first_commit_hash, $last_commit_hash]);

        push @plot_dates, $current_date;
        push @plot_commits, $commits_count;
    }

    $start_time->add(days => 1);
}

close $timetable_fh;
close $table2_fh;

# Define the year and month
my $current_year = $original_start_time->year;
my $current_month = $original_start_time->month;

# Output total working hours and commits count
print "Total Working Hours: $total_working_hours hours\n";
print "Total Commits Count: $total_commits_count\n";

# Clean up temporary files
unlink 'timetable.csv';
unlink 'table2.csv';

# Create a hash of workdays
my %workdays = ();

# Iterate through each day in the month
while ($current_month == $original_start_time->month) {
    my $day = $original_start_time->day;
    my $current_date = $original_start_time->strftime('%Y-%m-%d');
    my $current_month = $original_start_time->strftime('%m');
    my $current_year = $original_start_time->strftime('%Y');
    my $day_of_week = Day_of_Week($current_year, $current_month, $day);

    my $is_holiday = Date::Holidays->is_holiday(
            year      => $current_year,
            month     => $current_month,
            day       => $day,
            countries => ['de'],
            WHERE=>['common', 'sn']
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
    }

    $original_start_time->add(days => 1);
}

# Reinitialize the start time for printing the calendar
$original_start_time = DateTime::Format::Strptime->new(pattern => '%Y-%m-%d')->parse_datetime($start_date);

# Create a table for displaying the calendar
my $table = Text::Table->new('Day', 'Working Hours');
my @weekend_days;

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
            $color = 'blue';
        } elsif ($workdays{$current_date} eq 'OVERTIME' || $workdays{$current_date} eq 'UNDERTIME') {
            $color = 'red';
        }
    }

    # Calculate the working hours for the day
    my $working_hours = $global_working_hours{$current_date} || '0:00';
    
    # Add day and working hours to the table
    $table->add($day, colored($working_hours, $color));

    # Increment the day
    $original_start_time->add(days => 1);

    # Change line on Saturday (end of the week)
    if ($day_of_week == 6) {
        print $table;
        print "\n";

        # Display weekend days on the right
        if (@weekend_days) {
            my $weekend_table = Text::Table->new();
            $weekend_table->load(@weekend_days);
            print $weekend_table;
        }

        # Reset the tables for the next week
        $table = Text::Table->new('Day', 'Working Hours');
        @weekend_days = ();
    }
}

# Print any remaining days at the end of the month
if ($table->body() || @weekend_days) {
    print $table;
    if (@weekend_days) {
        my $weekend_table = Text::Table->new();
        $weekend_table->load(@weekend_days);
        print $weekend_table;
    }
    print "\n";
}

