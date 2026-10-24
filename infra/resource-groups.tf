resource "azurerm_resource_group" "this" {
  name     = "rg-${local.resource_suffix}"
  location = var.location
  tags     = local.tags
}
