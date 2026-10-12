from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
import torch

# 4-bit base model
bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                          bnb_4bit_compute_dtype=torch.bfloat16)
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.1-8B",
                                              quantization_config=bnb)

# LoRA adapter
lora = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"],
                   lora_dropout=0.05, task_type="CAUSAL_LM")
model = get_peft_model(model, lora)
model.print_trainable_parameters()  # ~0.1% of params

# Train
trainer = Trainer(model=model, args=TrainingArguments(...), train_dataset=ds)
trainer.train()
