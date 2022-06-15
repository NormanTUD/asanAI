<?php
    include('functions.php');
    
?>

<!DOCTYPE html>

<html lang="en">
    <head>
        <title>Model Administration</title>
        <meta charset="UTF-8">
        <script src="jquery.js"></script>
    </head>

    <body>
        <h1>Model Administration</h1>
<?php
    $network_names = get_network_names();
    $is_public = get_network_data("is_public");
    if(count($network_names)) {
?>
        <h2>Delete Model</h2>
        <span id="delete_model_msg"></span><br/>
        <select id="network_select">
<?php
        foreach($network_names as $name) {
?>
            <option id="<?php print htmlentities($name); ?>"><?php print htmlentities($name); ?></option>
<?php
        }
?>
        </select>

        <button onclick="delete_network()">Delete</button>
            
        <h2>Model Table</h2>

        <table>
            <tr>
                <th>Name</th>
            </tr>
<?php
        $network_names = get_network_names();
        foreach($network_names as $name) {
?>
            <tr>
                <td id="<?php print htmlentities($name); ?>"><?php print htmlentities($name); ?></td>
            </tr>
<?php
        }
?>
        </table>

        <table>
            <tr>
                <th>Name</th>
                <th>Public</th>
                <th>Requests public</th>
            </tr>
<?php
        $network_data = get_network_data();
        foreach($network_data as $data) {
            //dier($data["is_public"]);
?>
            <tr>
                <td onclick="change_to_public(this)" id="<?php print htmlentities($data["network_name"]); ?>"><?php print htmlentities($data["network_name"]); ?></td>
                <td><?php print htmlentities($data["is_public"]); ?></td>
                <td><?php print htmlentities($data["requests_public"]); ?></td>
            </tr>
<?php
        }
?>
        </table>
<?php
    } else {
        print "No models found.";
    }
?>
        <script>

            function delete_network() {
                network_name = document.getElementById("network_select").value;
                $.ajax({
                    url: "delete_network.php?network_name=" + network_name,
                    success: function(data) {
                        document.getElementById("delete_model_msg").style = "background-color: green";
                        document.getElementById("delete_model_msg").innerText = data;
                        document.getElementById(network_name).remove();
                        document.getElementById(network_name).remove();
                    }
                });
            }

            function change_to_public(elem) {
                console.log(elem);
                $.ajax({
                    url: "update_is_public.php?network_name=" + elem.id
                });
            }

        </script>
    </body>
</html>