from trl import DPOTrainer, DPOConfig

trainer = DPOTrainer(
    model=model,
    ref_model=None,  # uses LoRA-disabled copy automatically
    args=DPOConfig(output_dir="dpo-out", beta=0.1, ...),
    train_dataset=preference_dataset,
    tokenizer=tokenizer
)
trainer.train()
