<?php include_once("functions.php"); ?>
<!--
COURSE_METADATA:
title: What Machines See
description: Object detection, segmentation, SAM, Vision Transformers and 3D — the modern computer-vision task stack built on the convolution.
icon: &#128065;
part: 3
order: 6
color: emerald
topics: vision, architecture, programming, multimodal
-->

<div class="md">
The Convolutions and Deep Learning chapters taught the **mechanism** — how a stack of filters turns pixels into features. This chapter is the **task stack** on top: what we actually *ask* a vision model to do. The ladder runs **classification → detection → segmentation → 3D**, each a harder, more spatial question than the last.
</div>

<div class="md">
## From classification to detection

**Classification** asks one question of a whole image: *which of the labels?* ImageNet \cite[Krizhevsky et al., 2012]{krizhevsky2012imagenet} and the ResNet that dominated it \cite[He et al., 2015]{he2015resnet} are the reference points. **Detection** asks for *many* objects at once, each with a box and a label, measured by **mAP** across IoU thresholds. Two families emerged:

| Family | Idea | Method |
|--------|------|--------|
| Two-stage | Propose regions, then classify | **R-CNN** \cite[Girshick et al., 2014]{girshick2014rcnn} → **Faster R-CNN** (learned proposals) \cite[Ren et al., 2015]{ren2015faster} |
| One-stage | Predict boxes in one pass | **YOLO** \cite[Redmon et al., 2016]{redmon2016yolo} — detection as a single regression, fast enough for real time |

Two-stage was more accurate; one-stage was faster. The gap closed as both scaled — the same lesson as everywhere in this book.
</div>

<div class="md">
## Segmentation: pixels, not boxes

Boxes are coarse. **Segmentation** labels at the pixel level: **semantic** (each pixel → class), **instance** (each object separated), **panoptic** (both).

* **U-Net** \cite[Ronneberger et al., 2015]{ronneberger2015unet}: encoder–decoder with skip connections; the biomedical workhorse, trainable on few images.
* **Mask R-CNN** \cite[He et al., 2017]{he2017maskrcnn}: Faster R-CNN plus a branch that predicts a **mask per instance**.
* **Segment Anything (SAM)** \cite[Kirillov et al., 2023]{kirillov2023sam}: a *promptable* foundation model — point at an object, it segments it. Trained on **1 billion masks**, it transfers zero-shot. The "ImageNet moment" for segmentation.
</div>

<div class="image-row md">
<figure style="max-width:720px; margin:1.5em auto; text-align:center;">
	<img src="sam_demo.png" alt="The same scene segmented into different objects by pointing at different parts, produced by the Segment Anything Model" style="width:100%; height:auto; border-radius:6px;" />
	<figcaption class="md">One image, several prompts: SAM segments whatever you point at, zero-shot. \cite[Image: Segment Anything Model demo]{sam_demo_img}</figcaption>
</figure>
</div>

<div class="md">
## ViTs: the Transformer arrives in vision

The **Vision Transformer (ViT)** \cite[Dosovitskiy et al., 2021]{dosovitskiy2021vit} splits an image into 16×16 **patches**, treats them as tokens, and runs a plain Transformer. With enough data it matches or beats the best CNNs — the convolution's inductive bias is useful but not essential. Two companions completed the picture: **MAE** \cite[He et al., 2022]{he2021mae}, self-supervised pretraining by masking 75% of patches; and **CLIP** \cite[Radford et al., 2021]{radford2021clip}, contrastive pretraining on (image, caption) pairs, giving vision a *text* interface — the bridge to <a href="multimodal">Multimodal</a> and <a href="diffusion">Diffusion</a>.
</div>

<div class="md">
## Beyond 2D: the world

Real vision is 3D and dynamic: **pose** (keypoints), **depth**, **point clouds**, and **NeRF**-style radiance fields that render novel views. Generative models now produce 3D and video, not just stills (see <a href="diffusion">Diffusion</a>).

**Why it matters.** This perception stack is what <a href="agents">agents</a> and embodied AI rely on, and why a multimodal LLM can *see*. The vision foundation models — SAM, ViT, CLIP — tell **the same scaling story as LLMs, applied to pixels**: gather a huge corpus, pre-train one model, fine-tune it into any task.
</div>

<script>
async function loadComputerVisionModule() {
	updateLoadingStatus("Loading section about What Machines See...");
	return Promise.resolve();
}
</script>