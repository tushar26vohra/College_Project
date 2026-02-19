################################
# ORIGIN ACCESS IDENTITY (S3)
################################
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for frontend"
}

################################
# BUCKET POLICY (Allow CloudFront)
################################
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

################################
# CLOUDFRONT DISTRIBUTION
################################
resource "aws_cloudfront_distribution" "cdn" {

  depends_on = [aws_s3_bucket_policy.policy]

  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  ################################
  # S3 ORIGIN (FRONTEND)
  ################################
  origin {
    domain_name = var.bucket_domain_name
    origin_id   = "s3-origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  ################################
  # ALB ORIGIN (BACKEND API)
  ################################
  origin {
    domain_name = var.alb_dns_name
    origin_id   = "alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  ################################
  # DEFAULT BEHAVIOR (S3)
  ################################
  default_cache_behavior {
    target_origin_id       = "s3-origin"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  ################################
  # API BEHAVIOR (ALB)
  ################################
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    target_origin_id = "alb-origin"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = [
      "GET",
      "HEAD",
      "OPTIONS",
      "PUT",
      "POST",
      "PATCH",
      "DELETE"
    ]

    cached_methods = ["GET", "HEAD"]

    forwarded_values {
      query_string = true
      headers      = ["*"]

      cookies {
        forward = "all"
      }
    }
  }

  ################################
  # CERTIFICATE
  ################################
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

################################
# OUTPUT
################################
output "cloudfront_url" {
  value = aws_cloudfront_distribution.cdn.domain_name
}
