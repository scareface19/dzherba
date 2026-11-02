# -*- coding: utf-8 -*-
import os
import sys
import json
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import numpy as np

def predict(image_path, top_k=5):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Load MobileNetV2
    weights = models.MobileNet_V2_Weights.DEFAULT
    model = models.mobilenet_v2(weights=weights)
    model.classifier = torch.nn.Identity()
    model.to(device)
    model.eval()

    preprocess = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    # Load index
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_path = os.path.join(base_dir, 'server', 'models', 'plant_vision_index.npz')
    
    if not os.path.exists(index_path):
        print(json.dumps({"error": "Vision index not found"}))
        return

    data = np.load(index_path)
    embeddings = data['embeddings'] # (N, 1280)
    plant_ids = data['plant_ids']   # (N,)

    # Process query image
    try:
        with Image.open(image_path) as pil_img:
            pil_img = pil_img.convert('RGB')
            input_tensor = preprocess(pil_img).unsqueeze(0).to(device)
            with torch.no_grad():
                query_feat = model(input_tensor).cpu().numpy().flatten()
                norm = np.linalg.norm(query_feat)
                if norm > 0:
                    query_feat = query_feat / norm
    except Exception as e:
        print(json.dumps({"error": f"Image load failed: {str(e)}"}))
        return

    # Cosine similarities
    sims = np.dot(embeddings, query_feat) # Values roughly between -1 and 1

    # Aggregate best similarity per plant_id
    species_scores = {}
    for sim, pid in zip(sims, plant_ids):
        pid = int(pid)
        if pid not in species_scores or sim > species_scores[pid]:
            species_scores[pid] = float(sim)

    # Sort descending
    sorted_species = sorted(species_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

    results = []
    for pid, sim in sorted_species:
        # Scale cosine similarity (e.g. 0.4 -> 60%, 0.7 -> 88%, 0.9 -> 98%)
        # Sigmoid or linear mapping for intuitive confidence display
        confidence = float(np.clip((sim - 0.2) / 0.65 * 100, 15.0, 99.2))
        results.append({
            "plant_id": pid,
            "raw_similarity": round(float(sim), 4),
            "confidence": round(confidence, 1)
        })

    print(json.dumps(results))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing image_path argument"}))
        sys.exit(1)
    predict(sys.argv[1])
