import io
import json
import os
import time
import uuid
import boto3
from PIL import Image

# AWS クライアントの初期化
REGION = os.getenv("AWS_DEFAULT_REGION", "ap-northeast-1")
BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "YOUR_S3_BUCKET_NAME")

iot_client = boto3.client("iot-data", region_name=REGION)
s3_client = boto3.client("s3", region_name=REGION)


def generate_dummy_image_bytes() -> io.BytesIO:
    """ダミーの28x28画像（JPEGバイトデータ）を生成"""
    img = Image.new("L", (28, 28), color=128)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    buffer.seek(0)
    return buffer


def run_dummy_inference() -> dict:
    image_id = str(uuid.uuid4())
    confidence = 0.45  # 0.7未満のためS3アップロード対象

    return {
        "id": image_id,
        "timestamp": int(time.time()),
        "class_id": 0,
        "label": "T-shirt/top",
        "confidence": confidence,
        "needs_annotation": confidence < 0.7,
        "image_s3_key": None,
    }


def upload_image_to_s3(image_id: str, image_bytes: io.BytesIO) -> str:
    """S3 に画像をアップロードし、S3キーを返す"""
    s3_key = f"unannotated/{image_id}.jpg"
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=image_bytes,
        ContentType="image/jpeg",
    )
    print(f"Uploaded image to S3: s3://{BUCKET_NAME}/{s3_key}")
    return s3_key


def main():
    payload = run_dummy_inference()

    # 確信度が0.7未満（needs_annotation=True）の場合にS3へ画像保存
    if payload["needs_annotation"]:
        img_bytes = generate_dummy_image_bytes()
        s3_key = upload_image_to_s3(payload["id"], img_bytes)
        payload["image_s3_key"] = s3_key

    print(f"Sending payload: {payload}")

    # IoT Core 経由で DynamoDB へ保存
    iot_client.publish(
        topic="device/inference/data",
        qos=0,
        payload=json.dumps(payload),
    )
    print("Successfully sent to AWS IoT Core!")


if __name__ == "__main__":
    main()
