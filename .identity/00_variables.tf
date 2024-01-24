variable "tags" {
  type = map(any)
}

variable "prefix" {
  type = string
}

variable "env" {
  type = string
}

variable "env_short" {
  type = string
}

variable "domain" {
  type = string
}

variable "opex_environment_ci_roles" {
  type = object({
    subscription    = list(string)
    resource_groups = map(list(string))
  })
  description = "GitHub Continous Integration roles"
}

variable "opex_environment_cd_roles" {
  type = object({
    subscription    = list(string)
    resource_groups = map(list(string))
  })
  description = "GitHub Continous Delivery roles"
}
