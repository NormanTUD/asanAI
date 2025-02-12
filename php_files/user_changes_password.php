<?php
    
    include('functions.php');
    setcookie("random", generateRandomString(5));
    //setcookie("email_sent", 0);
    //setcookie("email", "");

    function sent_email() {
        $message = "Your reset code is: ".$_COOKIE["random"];
        $email = "print '<script> document.getElementById('email').value;</script>'";
        $message = "Email: $email<br>\nMessage:\n<br>========== BEGIN ==========\n<br>$message<br>\n<br>=========== END ===========<br>\n";

        if(PHPMailer\PHPMailer\oMailerSend(array(array($email, $email)), $message, $email)) {
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
    <script>
        function setCookie(name,value,days) {
            var expires = "";
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days*24*60*60*1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + (value || "")  + expires + "; path=/;";
        }

        function getCookie(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        }

        function change_password() {
            //window.location.href = "user_changes_password.php";
        }

        function check_random(email) {
            var random_number = '<?php print $_COOKIE["random"] ?>';
            if(document.getElementById("code_field").value == random_number) {
                var password = document.getElementById("new_password");
                if(password != "") {
                    $.ajax({
                        url: "change_password.php?email=" + email + "&password=" + password
                    });
                }
            }
        }
    </script>
</html>
