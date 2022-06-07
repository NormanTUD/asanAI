<?php
    
    include('functions.php');

    function sent_email() {
        $_COOKIE["random"] = generateRandomString(5);
        $message = "Your reset code is: ".$random;
        $email = "print '<script> document.getElementById('email').value;</script>'";
        $message = "Email: $email<br>\nMessage:\n<br>========== BEGIN ==========\n<br>$message<br>\n<br>=========== END ===========<br>\n";

        if(PHPMailer\PHPMailer\oMailerSend(array(array($email)), $message, $email)) {
            $_COOKIE["email_sent"] = 1;
        } else {
            $errors[] = 'Error sending Email. Please try again later.';
        }
        $_COOKIE["email_sent"] = 1;

    }
?>
<!DOCTYPE html>

<html lang="en">
    <head>
        <title>Reset password</title>
    </head>
    <script>
        function change_password() {
            <?php sent_email() ?>
            window.location.href = "user_changes_password.php";
        }
        function check_random() {
            var random_number = <?php print $_COOKIE["random"] ?>;
            if(document.getElementById("code_field").value == random_number) {
                var password = document.getElementById("new_password");
                if(password != "") {
                    $.ajax({
                        url: "change_password.php?email=" + <?php print $_COOKIE["email"] ?> + "&password=" + password
                    });
                }
            }
        }
    </script>
    <body>
        <h1>Reset your password</h1>
<?php
    if($_COOKIE["email_sent"] != 1) {
?>
        <input name="email" id="email" type="text" placeholder="email" value="email">
        <button onclick="change_password()">Submit</button>
<?php
    //print "<script>console.log(document.getElementById('email').value);</script>";
    }
?>

<?php
    if($_COOKIE["email_sent"] == 1) {
?>
        <input id="new_password" type="password" placeholder="new password">
        <input id="code_field" type="text" placeholder="Your code">
        <button onclick="check_random()">Submit</button>
<?php
    }
?>
    </body>
</html>