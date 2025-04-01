<div id="own_tensor_tab" class="tab">
		<div id="prepare_data">
			<span class="TRANSLATEME_pretext_prepare_data"></span><br>
			<pre><code class="language-python" id="convert_data_python">import numpy as np
import pandas as pd

def write_file_for_tfjs(name, data):
    with open(name + '.txt', 'w') as outfile:
        outfile.write('# shape: {0}\n'.format(data.shape))
        
        for data_slice in data.values:
            data_slice = np.array(data_slice, dtype=np.float64)  # Um sicherzustellen, dass es numerisch ist
            
            np.savetxt(outfile, data_slice.reshape(1, -1), fmt='%.18e')  # Nutze einen Format-String für fließkommazahlen
            outfile.write('# New slice\n')

x_train = pd.DataFrame([1, 2, 3, 5, 6, 7])
y_train = pd.DataFrame([9, 8, 7, 6, 5, 4])

write_file_for_tfjs("x", x_train)
write_file_for_tfjs("y", y_train)
</code></pre>
		<button class="TRANSLATEME_copy_to_clipboard" onclick="copy_id_to_clipboard('convert_data_python')"></button>
	</div>
	<br>
	<div class="upload-btn-wrapper">
		<button class=""><span class="TRANSLATEME_provide_x_data"></span></button>
		<input id="upload_x_file" type="file" name="x_data">
	</div>
	<div class="upload-btn-wrapper">
		<button class="TRANSLATEME_provide_y_data"></button>
		<input id="upload_y_file" type="file" name="y_data">
	</div>
	<br>
	<span class="TRANSLATEME_max_number_of_values"></span>: <input type="number" min="1" value="0" id="max_number_values" style="width: 50px;">
</div>
