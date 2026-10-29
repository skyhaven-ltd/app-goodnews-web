resource "cloudflare_dns_record" "apex_cname" {
  zone_id = local.cloudflare_zone_id
  type    = "CNAME"
  name    = var.dns_zone_name
  content = azurerm_static_web_app.this.default_host_name
  proxied = true
  ttl     = 1
}

resource "cloudflare_dns_record" "www_cname" {
  zone_id = local.cloudflare_zone_id
  type    = "CNAME"
  name    = "www.${var.dns_zone_name}"
  content = azurerm_static_web_app.this.default_host_name
  proxied = true
  ttl     = 1
}

resource "cloudflare_dns_record" "apex_dnsauth" {
  zone_id = local.cloudflare_zone_id
  type    = "TXT"
  name    = "_dnsauth.${var.dns_zone_name}"
  content = azurerm_static_web_app_custom_domain.apex.validation_token
  proxied = false
  ttl     = 1

  lifecycle {
    ignore_changes = [content]
  }
}

resource "cloudflare_dns_record" "www_dnsauth" {
  zone_id = local.cloudflare_zone_id
  type    = "TXT"
  name    = "_dnsauth.www.${var.dns_zone_name}"
  content = azurerm_static_web_app_custom_domain.www.validation_token
  proxied = false
  ttl     = 1

  lifecycle {
    ignore_changes = [content]
  }
}
