#!/bin/bash

components=(
  "alert-dialog"
  "avatar"
  "badge"
  "breadcrumb"
  "button"
  "card"
  "chart"
  "checkbox"
  "command"
  "context-menu"
  "dialog"
  "drawer"
  "dropdown-menu"
  "input"
  "label"
  "popover"
  "scroll-area"
  "select"
  "separator"
  "sheet"
  "sidebar"
  "skeleton"
  "sonner"
  "table"
  "tabs"
  "textarea"
  "toggle-group"
  "toggle"
  "tooltip"
)

for comp in "${components[@]}"; do
  echo "Updating $comp..."
  # 删除旧文件
  rm -f "components/ui/${comp}.ts" "components/ui/${comp}.tsx"
  
  # 重新添加组件（CLI 会提示覆盖，如果没有就直接添加）
  npx shadcn@latest add "$comp"
done

echo "All components updated."