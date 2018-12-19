export const yesNoTemplate = (projectName: string): string => {
    return `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ${projectName}.Business.Enums
{
    public static class YesOrNo
    {
        public static string YES = "yes";
        public static string NO = "no";
    }
}`;
};