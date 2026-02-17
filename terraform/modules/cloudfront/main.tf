resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for frontend"
}

resource "aws_s3_bucket_policy" "policy" {
  bucket = var.bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
      }
      Action   = "s3:GetObject"
      Resource = "${var.bucket_arn}/*"
    }]
  })
}

resource "aws_cloudfront_distribution" "cdn" {

  depends_on = [aws_s3_bucket_policy.policy]

  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name = var.bucket_domain_name
    origin_id   = "frontend-origin"

    # s3_origin_config {
    #   origin_access_identity =
    #     aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    # }
    s3_origin_config {
  origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
}

  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "frontend-origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
