<?php
    
    include('functions.php');

    function sent_email() {
        $random = generateRandomString(5);
        $message = "Your reset code is: ".$random;
        $email = "<script> document.getElementById('email').value; console.log('enst email');</script>";
        $message = "Email: $email<br>\nMessage:\n<br>========== BEGIN ==========\n<br>$message<br>\n<br>=========== END ===========<br>\n";

        if(PHPMailer\PHPMailer\oMailerSend(array(array($email)), $message)) {
            $email_sent = 1;
        } else {
            $errors[] = 'Error sending Email. Please try again later.';
        }
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
        }    
    </script>
    <body>
        <h1>Reset your password</h1>
        <input name="email" id="email" type="text" placeholder="email">
        <button onclick="change_password()">Submit</button>
    </body>
</html>