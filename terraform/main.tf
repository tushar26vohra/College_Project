# ################################
# # RANDOM SUFFIX
# ################################
# resource "random_id" "suffix" {
#   byte_length = 4
# }

# ################################
# # LOCALS
# ################################
# locals {
#   bucket_name = "${var.bucket_prefix}-${random_id.suffix.hex}"
# }

# ################################
# # S3 BUCKET
# ################################
# resource "aws_s3_bucket" "frontend" {
#   bucket = local.bucket_name
# }

# resource "aws_s3_bucket_public_access_block" "block" {
#   bucket = aws_s3_bucket.frontend.id

#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }

# ################################
# # CLOUDFRONT OAI
# ################################
# resource "aws_cloudfront_origin_access_identity" "oai" {
#   comment = "OAI for frontend"
# }

# ################################
# # UPLOAD FILES (CLIENT DIST)
# ################################
# # resource "aws_s3_object" "files" {
# #   for_each = fileset("${path.module}/../app/CodeMate-main/client/dist", "**/*")

# #   bucket = aws_s3_bucket.frontend.id
# #   key    = each.value
# #   source = "${path.module}/../app/CodeMate-main/client/dist/${each.value}"
# #   etag   = filemd5("${path.module}/../app/CodeMate-main/client/dist/${each.value}")
# # }

# resource "aws_s3_object" "files" {
#   for_each = fileset("${path.module}/../app/CodeMate-main/client/dist", "**/*")

#   bucket = aws_s3_bucket.frontend.id
#   key    = each.value
#   source = "${path.module}/../app/CodeMate-main/client/dist/${each.value}"
#   etag   = filemd5("${path.module}/../app/CodeMate-main/client/dist/${each.value}")

#   content_type = lookup(
#     {
#       html = "text/html"
#       css  = "text/css"
#       js   = "application/javascript"
#       json = "application/json"
#       png  = "image/png"
#       jpg  = "image/jpeg"
#       jpeg = "image/jpeg"
#       gif  = "image/gif"
#       svg  = "image/svg+xml"
#       ico  = "image/x-icon"
#       txt  = "text/plain"
#     },
#     split(".", each.value)[length(split(".", each.value)) - 1],
#     "application/octet-stream"
#   )
# }


# ################################
# # BUCKET POLICY FOR OAI
# ################################
# resource "aws_s3_bucket_policy" "policy" {
#   bucket = aws_s3_bucket.frontend.id

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [{
#       Effect = "Allow"
#       Principal = {
#         AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
#       }
#       Action   = "s3:GetObject"
#       Resource = "${aws_s3_bucket.frontend.arn}/*"
#     }]
#   })
# }

# ################################
# # CLOUDFRONT DISTRIBUTION
# ################################
# resource "aws_cloudfront_distribution" "cdn" {
#   enabled             = true
#   default_root_object = "index.html"

#   origin {
#     domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
#     origin_id   = "frontend-origin"

#     s3_origin_config {
#       origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
#     }
#   }

#   default_cache_behavior {
#     allowed_methods  = ["GET", "HEAD"]
#     cached_methods   = ["GET", "HEAD"]
#     target_origin_id = "frontend-origin"

#     forwarded_values {
#       query_string = false
#       cookies {
#         forward = "none"
#       }
#     }

#     viewer_protocol_policy = "redirect-to-https"
#   }

#   viewer_certificate {
#     cloudfront_default_certificate = true
#   }

#   restrictions {
#     geo_restriction {
#       restriction_type = "none"
#     }
#   }
# }

# # ################################
# # # OUTPUT
# # ################################
# # output "cloudfront_url" {
# #   value = aws_cloudfront_distribution.cdn.domain_name
# # }

resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  bucket_name = "${var.bucket_prefix}-${random_id.suffix.hex}"
  dist_path   = "${path.module}/../app/CodeMate-main/client/dist"
}

module "s3" {
  source      = "./modules/s3"
  bucket_name = local.bucket_name
  dist_path   = local.dist_path
}

module "cloudfront" {
  source             = "./modules/cloudfront"
  bucket_id          = module.s3.bucket_id
  bucket_arn         = module.s3.bucket_arn
  bucket_domain_name = module.s3.bucket_regional_domain_name
}

module "vpc" {
  source = "./modules/vpc"
}
