Here's the complete specification for implementing the **Document Request Feature** in Papra, including the required database schema adjustments:

## Feature Overview

The **Document Request Feature** allows Papra users to create links through which others can upload documents directly into an organization's document archive. These links can be configured for multiple specific file types, restricted to one-time or multiple uses, pre-assigned tags per file type, and configured access levels (organization members only, authenticated users, or public access).

---

## Functional Requirements

### 1. Creating a Document Request

Users should be able to configure the following when creating a request:

* **Title**: Descriptive title for the request (e.g., "Quarterly Reports Submission").
* **Description** (optional): Brief context/instructions.
* **File Types Configuration**: Define multiple specific file types that can be uploaded:
  * **File Title**: Descriptive name for each file type (e.g., "Financial Report", "Supporting Documents").
  * **File Description** (optional): Specific instructions for each file type.
  * **Allowed MIME Types**: Specify accepted file formats (e.g., `['application/pdf', 'image/jpeg']` or `['*/*']` for all types).
  * **Size Limit** (optional): Maximum file size in bytes for each file type.
  * **Predefined Tags**: Tags automatically applied to uploaded documents of this specific file type.
* **Use Limit**:
  * Single-use: Link is valid for only one submission.
  * Multi-use: Link allows multiple submissions.
  * Unlimited submissions option (toggle on/off).
* **Expiration Date** (optional): Request becomes invalid after a specific date.
* **Access Restrictions**:
  * **Org Members Only**: Only current organization members can submit.
  * **Authenticated Users**: Any logged-in user can submit.
  * **Public Access**: Anyone with the link can submit.

### 2. Document Upload via Request Link

When a recipient accesses the link:

* They see the request details (title, description, required file types).
* If access restricted, validation occurs based on the specified type.
* User uploads documents for each configured file type:
  * Each file type shows its specific title, description, and requirements.
  * Files are validated against the configured MIME types and size limits.
  * Users can see which tags will be automatically applied to each file type.
* Documents are tagged automatically based on predefined tags for each file type.

### 3. Managing Requests

* Creator can view active/inactive requests.
* Creator can disable, edit, or delete a request (deletion/archive keeps submitted docs intact).
* Creator can modify file type configurations, including adding/removing file types.

### 4. Notifications & Tracking

* Optional notifications via email or app notifications upon document upload.
* Request creator receives updates about submissions.


## Conclusion

This spec outlines a robust document request feature with multi-file type support, integrating smoothly with Papra's existing architecture, providing flexibility, security, and ease-of-use, fulfilling both individual and organizational needs effectively.
