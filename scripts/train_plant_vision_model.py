# -*- coding: utf-8 -*-
import os
import glob
import json
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import numpy as np

def build_vision_index():
    print("[1/4] Initializing MobileNetV2 feature extractor...")
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Running on device: {device}")

    # Use pretrained MobileNetV2 backbone (headless)
    weights = models.MobileNet_V2_Weights.DEFAULT
    model = models.mobilenet_v2(weights=weights)
    model.classifier = torch.nn.Identity() # Remove top classification layer to get 1280-dim embedding
    model.to(device)
    model.eval()

    preprocess = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    base_dir = r'D:\DzHerba'
    startup_dir = os.path.join(base_dir, 'startup', 'startup')
    json_path = os.path.join(base_dir, 'data', 'plants.json')

    # Load plants name dictionary
    plant_names = {}
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            for p in json.load(f):
                plant_names[p['id']] = p['scientific_name']

    embeddings = []
    plant_ids = []
    file_paths = []

    print("[2/4] Scanning plant image directories in startup/startup...")
    folders = [f for f in os.listdir(startup_dir) if f.isdigit()]
    print(f"Total folders to process: {len(folders)}")

    processed_images = 0
    with torch.no_grad():
        for folder_name in sorted(folders, key=lambda x: int(x)):
            plant_id = int(folder_name)
            folder_path = os.path.join(startup_dir, folder_name)
            imgs = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]

            for img_name in imgs:
                img_path = os.path.join(folder_path, img_name)
                try:
                    with Image.open(img_path) as pil_img:
                        pil_img = pil_img.convert('RGB')
                        input_tensor = preprocess(pil_img).unsqueeze(0).to(device)
                        feat = model(input_tensor).cpu().numpy().flatten()
                        norm = np.linalg.norm(feat)
                        if norm > 0:
                            feat = feat / norm
                        embeddings.append(feat)
                        plant_ids.append(plant_id)
                        file_paths.append(img_path)
                        processed_images += 1
                except Exception as e:
                    pass

    print(f"[3/4] Successfully extracted embeddings for {processed_images} plant images across {len(set(plant_ids))} species.")

    # Save to server models directory
    model_dir = os.path.join(base_dir, 'server', 'models')
    os.makedirs(model_dir, exist_ok=True)
    output_path = os.path.join(model_dir, 'plant_vision_index.npz')

    embeddings_matrix = np.array(embeddings, dtype=np.float32)
    plant_ids_array = np.array(plant_ids, dtype=np.int32)

    np.savez_compressed(
        output_path,
        embeddings=embeddings_matrix,
        plant_ids=plant_ids_array
    )

    meta_path = os.path.join(model_dir, 'plant_vision_meta.json')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump({
            'total_images': processed_images,
            'total_species': len(set(plant_ids)),
            'embedding_dim': 1280,
            'model_architecture': 'MobileNetV2 (1280-dim Normalized Feature Vector)'
        }, f, indent=2)

    print(f"[4/4] Model index saved successfully to {output_path}!")

if __name__ == '__main__':
    build_vision_index()
