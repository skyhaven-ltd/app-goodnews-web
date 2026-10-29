resource "azurerm_static_web_app" "this" {
  name                = "stapp-${local.resource_suffix}"
  resource_group_name = azurerm_resource_group.this.name
  location            = "westeurope"
  sku_tier            = "Free"
  sku_size            = "Free"
  tags                = local.tags

  lifecycle {
    ignore_changes = [
      repository_branch,
      repository_url,
    ]
  }
}

resource "azurerm_static_web_app_custom_domain" "apex" {
  static_web_app_id = azurerm_static_web_app.this.id
  domain_name       = var.dns_zone_name
  validation_type   = "dns-txt-token"
}

resource "azurerm_static_web_app_custom_domain" "www" {
  static_web_app_id = azurerm_static_web_app.this.id
  domain_name       = "www.${var.dns_zone_name}"
  validation_type   = "dns-txt-token"
}
