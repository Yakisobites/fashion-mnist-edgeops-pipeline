# Edge Inference Module

Jetson 端末上で推論処理を行い、AWS (IoT Core / S3) へデータを送信するためのモジュールです。

## 1. 依存ライブラリのインストール

以下の Python パッケージが必要です。

```bash
python3 -m pip install --user boto3 pillow python-dotenv
# 必要ならtorch torchvisionもインストール
pip3 install torch torchvision --extra-index-url <Jetsonのバージョンのcuda>
```

| パッケージ | 用途 |
| --- | --- |
| `boto3` | AWS サービス (IoT Core / S3) との通信 |
| `pillow` | 低確信度データのダミー画像生成・画像処理 |
| `python-dotenv` | `.env` ファイルからの環境変数読み込み |

## 2. 環境変数の設定

環境変数は `.env` ファイルを使用するか、ターミナルで `export` コマンドを実行して設定します。

### 方法 A: `.env` ファイルを使用する場合

`edge/` ディレクトリ直下に `.env` ファイルを作成し、接続情報を設定してください。

```env
# AWS リージョンおよび認証情報
AWS_DEFAULT_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY

# CDK デプロイ時に出力された S3 バケット名
S3_BUCKET_NAME=your-fashion-mnist-image-bucket-name

```

> **注意**: Access Key などの機密情報が含まれるため、`.env` ファイルは必ず `.gitignore` に追加し、Git 追跡対象外としてください。

### 方法 B: `export` コマンドで設定する場合（一時的な実行向け）

実行するシェルセッション内で以下を実行します。

```bash
export AWS_DEFAULT_REGION="ap-northeast-1"
export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
export S3_BUCKET_NAME="your-fashion-mnist-image-bucket-name"

```

## 3. 実行方法

`PYTHONPATH` に `src` ディレクトリを指定して実行します。

```bash
PYTHONPATH=src python3 -m edge_inference.main

```
