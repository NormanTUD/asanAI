<?php
    include('functions.php');
    
?>

<!DOCTYPE html>

<html lang="en">
    <head>
        <title>Model Administration</title>
        <meta charset="UTF-8">
        <script src="https://code.jquery.com/jquery-3.6.0.js"></script>
        <script src="https://code.jquery.com/ui/1.13.1/jquery-ui.js"></script>
        <link rel="stylesheet" href="https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css">
        <link rel="stylesheet" href="https://jqueryui.com/resources/demos/style.css">
    </head>

    <body>
        <h1>Model Administration</h1>
<?php
    $network_names = get_network_names();
    if(array_key_exists(0, $network_names)) {
?>
        <h2>Delete Model</h2>
        
        <select id="network_select">
<?php
        foreach($network_names as $name) {
?>
            <option><?php print $name; ?></option>
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
                <td><?php print $name; ?></td>
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
                        window.location.href = "model.php";
                    }
                });
            }

        </script>
    </body>
</html>