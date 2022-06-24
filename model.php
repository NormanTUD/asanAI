<?php
    include('functions.php');
    
?>

<!DOCTYPE html>

<html lang="en">
    <head>
        <title>Model Administration</title>
        <meta charset="UTF-8">
        <script src="jquery.js"></script>
        <style>
            .red1 {
                background-color: red;
            }
            .green1 {
                background-color: green;
                color: white;
            }
        </style>
    </head>

    <body>
        <h1>Model Administration</h1>
<?php
    $network_names = [];
    $query = "select name from model";
    $result = run_query($query);
    while ($row = $result->fetch_row()) {
	    $network_names[] = $row[0];
    }
    if(is_admin()) {
        if(count($network_names)) {
?>
            <h2>Delete Model</h2>
            <span id="delete_model_msg"></span><br/>
            <select id="network_select">
<?php
            foreach($network_names as $name) {
?>
                <option id="<?php print htmlentities($name);?>"><?php print htmlentities($name);?></option>
<?php
            }
?>
            </select>

            <button onclick="delete_network()">Delete</button>
                
            <h2>Model Table</h2>

            <table>
                <tr>
                    <th>Name</th>
                    <th>Public</th>
                    <th>Requests public</th>
                </tr>
<?php
	    $network_data = [];
	    $network_data_query = "select id, is_public, reviewed, name from model";
	    $result = run_query($query);
	    while ($row = $result->fetch_row()) {
		    $this_data = array(
			    "id" => $row[0],
			    "is_public" => $row[1],
			    "reviewed" => $row[2],
			    "network_name" => $row[3]
		    );
		    $this_data["requests_public"] = false;
		    if($this_data["is_public"] && !$this_data["reviewed"]) {
			    $this_data["requests_public"] = true;
		    }
		    $network_data[] = $this_data;
	    }

	    foreach($network_data as $data) {
?>
                <tr>
                    <td><?php print htmlentities($data["network_name"]);?></td>
                    <td class="<?php print $red = $data["is_public"] ? print "green" : print "red";?>"><?php print htmlentities($data["is_public"]);?></td>
                    <td class="<?php print $red = $data["requests_public"] ? print "green" : print "red";?>"><?php print htmlentities($data["requests_public"]);?></td>
<?php
                if($data["requests_public"] == "true") {
?>
                    <td><button id="<?php print htmlentities($data["network_name"]);?>" onclick="change_to_public(this)" >Change</button></td> 
<?php
                }
?>
                </tr>
<?php
            }
?>
            </table>
<?php
        } else {
            print "No models found.";
        }
    } else {
        print "You don't have the permission to edit.";
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
                        window.location.href = "model.php";

                    }
                });
            }

            function change_to_public(elem) {
                console.log(elem);
                $.ajax({
                    url: "update_is_public.php?network_name=" + elem.id,
                    success: function (data) {
                        console.log(data)
                        window.location.href = "model.php";
                    }
                });
            }

        </script>
    </body>
</html>
