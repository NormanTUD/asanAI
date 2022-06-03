<?php
    include('functions.php');

    function get_usernames() {
        $query = "select username from login";
        $result = run_query($query);
        while($row = $result->fetch_assoc()) {
            $usernames[] = $row["username"];
        }
        return $usernames;
    }

?>

<!DOCTYPE html>

<html lang="en">
    <head>
        <title>User Administration</title>
        <meta charset="UTF-8">
        <script src="https://code.jquery.com/jquery-3.6.0.js"></script>
        <script src="https://code.jquery.com/ui/1.13.1/jquery-ui.js"></script>
        <link rel="stylesheet" href="https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css">
        <link rel="stylesheet" href="https://jqueryui.com/resources/demos/style.css">
    </head>


    <body>
        <h1>User Administration</h1>

        <h2>Change User Data</h2>
        <span id="change_user_msg"></span><br/>
        <select id="user_select">
<?php
    foreach(get_usernames() as $option) {
?>
            <option><?php print $option; ?></option>
<?php
    }
?>
        </select><br/>

        <button onclick="delete_user()">Delete user</button><br/><br/>
        <input id="new_password" type="password" placeholder="New password"><br/>
        <button onclick="change_password()">Change passwort</button><br/>

        <h2>User table</h2>
            <table id="user_table">
                <tr>
                    <th>username</th>
                </tr>
<?php
    foreach(get_usernames() as $name) {
?>
                <tr>
                    <td><?php print $name ?><td>
                </tr>
<?php
    }
?>
            </table>

            <script>
            
            function get_user() {
                return document.getElementById("user_select").value;
            }

            function change_password() {
                var username = get_user();
                var password = document.getElementById("new_password").value;
                $.ajax({
                    url: "change_password.php?username=" + username + "&password=" + password,
                    success(data) {
                        document.getElementById("change_user_msg").innerText = data;
                    }
                });
            }

            function delete_user() {
                var username = get_user();
                $.ajax({
                    url: "delete_user.php?username=" + username,
                    success(data) {
                        if(data["status"] == "ok") {
                            window.location.href = "user.php";
                            document.getElementById("change_user_msg").style = "background-color: green";    

                        }
                        if(data["status"] == "error") {
                            document.getElementById("change_user_msg").style = "background-color: red";    
                        }
                        document.getElementById("change_user_msg").innerText = data["msg"];
                        log(data)
                        log(data["msg"])
                    }
                });
            }

            function log(msg) {
                console.log(msg)
            }
        </script>
    </body>
</html>