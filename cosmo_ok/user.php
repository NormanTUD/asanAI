<?php
    include('functions.php');
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

<?php
    if(is_admin()) {
        if(array_key_exists(0, get_usernames())) {
?>
    
        <h2>Change User Data</h2>
        <span id="change_user_msg"></span><br/>
        <span id="change_role_msg"></span><br/>
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
    
        <h2>User table</h2>
            <table id="user_table">
                <tr>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th>Save</th>
                </tr>
<?php
            foreach(get_usernames() as $name) {
?>
                <tr>
                    <td><?php print $name ?></td>
                    <td><input type="password" id="password_<?php print $name ?>" placeholder="password"></td>
                    <td>
                        <select id="role_<?php print $name?>">
<?php
                foreach(get_category_from_table("select name from role_table", "name") as $role) {
                    if(get_single_value_from_query("select name from tfd_db.login inner join role_table on login.role_id = role_table.id where username ='".$name."'") == $role) {
?>                    
                            <option selected><?php print $role ?></option>
<?php
                    } else {
?>
                            <option><?php print $role ?></option>
<?php  
                    }
                }
?>
                        </select>
                    </td>
                    <td><button onclick="save_changes('<?php print $name ?>', '<?php print 'password_'.$name ?>', '<?php print 'role_'.$name ?>')">Save</button></td>
                </tr>
<?php
            }
?>
            </table>
            
<?php
        } else {
            print "There are no userers.";
        }
?>
            <script>
            
            function log(msg) {
                console.log(msg)
            }

            function get_user() {
                return document.getElementById("user_select").value;
            }

            function save_changes(username, password_id, role_id) {
                var password = document.getElementById(password_id).value;
                if(password != "") {
                    save_password(username, password);
                }
                var role = document.getElementById(role_id).value;
                save_role(username, role);
            }

            function save_role(username, role) {
                $.ajax({
                    url: "save_role.php?role=" + role + "&username=" + username,
                    success(data) {
                        if(data["status"] == "ok") {
                            color_msg("change_role_msg", "green");
                            $("#change_role_msg").delay(1000).fadeOut();
                        }
                        if(data["status"] == "error") {
                            color_msg("change_role_msg", "red");
                        }
                        document.getElementById("change_role_msg").innerText = data["msg"];
                    }
                });
            }
            
            function save_password(username, password) {
                $.ajax({
                    url: "change_password.php?username=" + username + "&password=" + password,
                    success(data) {
                        if(data["status"] == "ok") {
                            color_msg("change_user_msg", "green");
                            $("#change_user_msg").delay(1000).fadeOut();
                        }
                        if(data["status"] == "error") {
                            color_msg("change_user_msg", "red");
                        }
                        document.getElementById("change_user_msg").innerText = data["msg"];
                    }
                });
            }

            function color_msg(id, color) {
                document.getElementById(id).style = "background-color: " + color;
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
                    }
                });
            }

        </script>
<?php
    } else {
        print "You don't have permission to edit.";
    }
?>
    </body>
</html>