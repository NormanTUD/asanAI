<?php 
    include('functions.php');

    if(array_key_exists("session_id", $_COOKIE)) {
        
        $user = get_user_id_from_session_id($_COOKIE["session_id"]);
        if(is_null($user)) {
            print "User doesn't exist.";
        } else {
            /*
            db.models.find(
                {
                    $or: [{user: {$eq: 62}}, {is_public: {$eq: "true"}}]
                }, 
                
                
                {"user": true, "is_public": true, "category": true, "model_weights": true, "model_structure": true});
            */
            $filters = array(
                '$or' => array(
                    array("user" => array('$eq' => $user)),
                    array("is_public" => array('$eq' => 'true'))
                )
                );
            $options = array(
                'user' => true,
                'is_public' => true,
                'category' => true,
                'model_weights' => 0,
                'model_structure' => 0,
                'network_name' => true
            );

            $results = find_mongo("tfd.models", $filters, $options);

            foreach ($results as $doc) {
                dier($doc["category"]);
            }
        }
    } else {
        print "You are not logged in.";
    }
?>