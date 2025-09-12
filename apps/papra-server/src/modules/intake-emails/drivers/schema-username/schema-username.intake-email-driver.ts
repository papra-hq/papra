import { Organization } from "better-auth/plugins";
import { User } from "../../../users/users.types";
import { defineIntakeEmailDriver } from "../intake-emails.drivers.models";
import { isNil } from "../../../shared/utils";
import { createError } from "../../../shared/errors/errors";
import { getEmailUsername } from "../../intake-emails.models";

export const SCHEMA_USERNAME_INTAKE_EMAIL_DRIVER_NAME = "schema-username";

export const schemaUsernameIntakeEmailDriverFactory = defineIntakeEmailDriver(
  ({ config }) => {
    const { domain, uniqueIdentifierSchema } =
      config.intakeEmails.drivers.schemaUsername;

    return {
      name: SCHEMA_USERNAME_INTAKE_EMAIL_DRIVER_NAME,
      generateEmailAddress: async (
        userHint?: User,
        organizationHint?: Organization
      ) => {
        if (isNil(userHint) || isNil(organizationHint)) {
          throw createError({
            statusCode: 500,
            message: "User and Organization hints are required for this driver",
            code: "intake_emails.driver_user_organization_hints_required",
          });
        }

        let emailIdentifier = uniqueIdentifierSchema;

        //{{username}}, {{random-digits}}, {{organization-id}}, {{organization-name}}
        const { username } = getEmailUsername({ email: userHint.email });
        emailIdentifier = emailIdentifier.replace(
          "{{username}}",
          username || ""
        );
        emailIdentifier = emailIdentifier.replace(
          "{{random-digits}}",
          Math.random().toString().slice(2, 8)
        );
        emailIdentifier = emailIdentifier.replace(
          "{{organization-id}}",
          organizationHint.id
        );
        emailIdentifier = emailIdentifier.replace(
          "{{organization-name}}",
          //Organization names have quotes
          organizationHint.name.replaceAll('"', "")
        );

        return {
          emailAddress: `${emailIdentifier}@${domain}`,
        };
      },
      // Deletion functionality is not required for this driver
      deleteEmailAddress: async () => {},
    };
  }
);
