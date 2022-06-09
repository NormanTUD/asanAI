<?php
    include('functions.php');

    function get_usernames() {
        $query = "select username, role_id from login";
        $result = run_query($query);
        while($row = $result->fetch_assoc()) {
            $usernames[] = $row["username"];
        }
        return $usernames;
    }

    function get_category_from_table($query, $column) {
        $result = run_query($query);
        while($row = $result->fetch_assoc()) {
            $category_array[] = $row[$column];
        }
        return $category_array;
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

<?php
    if(can_edit()) {
        if(array_key_exists(0, get_usernames())) {
?>
    
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
    
        <h2>User table</h2>
            <table id="user_table">
                <tr>
                    <th>username</th>
                    <th>password</th>
                    <th>role</th>
                    <th>save</th>
                </tr>
<?php
            foreach(get_usernames() as $name) {
?>
                <tr>
                    <td><?php print $name ?></td>
                    <td><input type="password" id="password_<?php print $name ?>" placeholder="password"></td>
                    <td>
                        <select id="status_<?php print $name?>">
<?php
                foreach(get_category_from_table("select name from role_table", "name") as $status) {
                    if(get_single_value_from_query("select name from tfd_db.login inner join role_table on login.role_id = role_table.id where username ='".$name."'") == $status) {
?>                    
                            <option selected><?php print $status ?></option>
<?php
                    } else {
?>
                            <option><?php print $status ?></option>
<?php  
                    }
                }
?>
                        </select>
                    </td>
                    <td><button onclick="change_password('<?php print $name ?>', '<?php print 'password_'.$name ?>', '<?php print 'status_'.$name ?>')">Save</button></td>
                </tr>
<?php
            }
?>
            </table>
            
<?php
        } else {
            print "There are no userers.";
        }
        
    } else {
        print "You don't have permission to edit.";
    }
?>
            <script>
            
            function get_user() {
                return document.getElementById("user_select").value;
            }

            function change_password(username, id, status) {
                // hier fehlt noch was übergabe von status überarbeiten
                var password = document.getElementById(id).value;
                status = document.getElementById(status).value;
                $.ajax({
                    url: "change_password.php?username=" + username + "&password=" + password + "&status=" + status,
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