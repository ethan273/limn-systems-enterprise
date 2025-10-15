#!/bin/bash

# Script to systematically update remaining CRM pages to use first_name/last_name
# This ensures consistent implementation across all files

set -e

echo "Updating customer detail page..."

# Customer detail page updates
file="src/app/crm/customers/[id]/page.tsx"

# Add import
sed -i '' '/import { toast } from "sonner";/a\
import { getFullName, createFullName } from "@/lib/utils/name-utils";
' "$file"

# Update formData state
sed -i '' 's/const \[formData, setFormData\] = useState({$/const [formData, setFormData] = useState({/' "$file"
sed -i '' '/const \[formData, setFormData\] = useState({/{
n
s/name: '"'"''"'"',/first_name: '"'"''"'"',\
    last_name: '"'"''"'"',/
}' "$file"

# Update useEffect sync
sed -i '' '/if (data?.customer) {/{
:a
n
s/name: data.customer.name/first_name: data.customer.first_name/
s/ || '"'"''"'"',/ || '"'"''"'"',/
t a
}' "$file"

# Insert last_name line after first_name
sed -i '' '/first_name: data.customer.first_name || '"'"''"'"',/a\
        last_name: data.customer.last_name || '"'"''"'"',
' "$file"

# Update handleSave validation
sed -i '' 's/if (!formData.name) {/if (!formData.first_name) {/' "$file"
sed -i '' 's/toast.error("Name is required");/toast.error("First name is required");/' "$file"

# Update handleSave mutation - add fullName creation before await
sed -i '' '/await updateMutation.mutateAsync({/i\
\
    const fullName = createFullName(formData.first_name, formData.last_name);
' "$file"

# Update mutation data object
sed -i '' '/await updateMutation.mutateAsync({/{
:a
n
s/name: formData.name,/first_name: formData.first_name,\
        last_name: formData.last_name || undefined,\
        name: fullName, \/\/ Maintain backward compatibility,/
t a
}' "$file"

# Update handleCancel reset
sed -i '' '/const handleCancel = () => {/,/setIsEditing(false);/{
s/name: data.customer.name/first_name: data.customer.first_name/
}' "$file"

sed -i '' '/if (data?.customer) {/,/setIsEditing(false);/{
/first_name: data.customer.first_name || '"'"''"'"',/a\
        last_name: data.customer.last_name || '"'"''"'"',
}' "$file"

# Update EntityDetailHeader title
sed -i '' 's/title={formData.name || "Unnamed Client"}/title={getFullName(formData) || "Unnamed Client"}/' "$file"

# Update EditableField labels - change "Full Name" to "First Name" and "Last Name"
sed -i '' '/<EditableField$/,/\/>/{
s/label="Full Name"/label="First Name"/
s/value={formData.name}/value={formData.first_name}/
s/onChange={(value) => setFormData({ ...formData, name: value })}/onChange={(value) => setFormData({ ...formData, first_name: value })}/
}' "$file"

# Add Last Name field after First Name field
sed -i '' '/<EditableField$/,/\/>/{
/<EditableField$/,/\/>/{
/label="First Name"/,/\/>/{
/\/>/a\
\
            <EditableField\
              label="Last Name"\
              value={formData.last_name}\
              isEditing={isEditing}\
              onChange={(value) => setFormData({ ...formData, last_name: value })}\
              icon={User}\
            \/>
}
}
}' "$file"

echo "Customer detail page updated!"
echo "Done!"
