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
    $network_names = [];
    $query = "select id, name from model";
    $result = run_query($query);
    while ($row = $result->fetch_row()) {
	    $network_names[] = array("id" => $row[0], "name" => $row[1]);
    }
    if(is_admin()) {
        if(count($network_names)) {
?>
            <h2>Delete Model</h2>
            <span id="delete_model_msg"></span><br/>
            <select id="network_select">
<?php
            foreach($network_names as $network) {
?>
                <option value="<?php print htmlentities($network["id"]);?>"><?php print htmlentities($network["name"]);?></option>
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
                    <th>Requests Public</th>
                    <th>Reviewed</th>
                </tr>
<?php
	    $network_data = [];
	    $network_data_query = "select id, is_public, reviewed, name from model";
	    $result = run_query($network_data_query);
	    while ($row = $result->fetch_row()) {
		    $this_data = array(
			    "id" => $row[0],
			    "is_public" => $row[1],
			    "reviewed" => $row[2],
			    "network_name" => $row[3]
		    );
		    $this_data["requests_public"] = 0;

		    if($this_data["is_public"] && !$this_data["reviewed"]) {
			    $this_data["requests_public"] = 1;
		    }

		    $network_data[] = $this_data;
	    }

	    foreach($network_data as $data) {
?>
                <tr>
                    <td><?php print htmlentities($data["network_name"]);?></td>
                    <td><input id="is_public<?php print $data["id"] ?>" type="checkbox" <?php $red = $data["is_public"] && $data["reviewed"] ? print "checked" : print "";?>></td>
                    <td><input type="checkbox" <?php $red = $data["requests_public"] ? print "checked" : print "";?>></td>
                    <td><input type="checkbox" <?php $red = $data["reviewed"] ? print "checked" : print "";?>></td>
<?php
                if($data["is_public"]) {
?>
                    <td><button id="<?php print htmlentities($data["id"]);?>" onclick="change_to_public(this)" >Change</button></td> 
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
                var network_id = document.getElementById("network_select").value;
                $.ajax({
                    url: "delete_network.php?id=" + network_id,
                    success: function(data) {
                        console.log(data)
                        document.getElementById("delete_model_msg").style = "color: white";
                        document.getElementById("delete_model_msg").style = "background-color: green";
                        document.getElementById("delete_model_msg").innerText = data;
                        window.location.href = "model.php";

                    }
                });
            }

            function change_to_public(elem) {
                console.log(elem);
                if(document.getElementById("is_public" + elem.id).checked) {
                    reviewed = 1;
                } else {
                    reviewed = 0;
                }
                $.ajax({
                    url: "update_is_public.php?id=" + elem.id + "&is_public=" + reviewed,
                    success: function (data) {
                        console.log(data);
                        window.location.href = "model.php";
                    }
                });
            }

        </script>
    </body>
</html>
