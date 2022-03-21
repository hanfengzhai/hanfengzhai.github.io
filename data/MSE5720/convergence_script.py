# Written by Massey Cashore and Sabrina Li Winter 2019
# Updated by Sabrina Li sjl57@cornell
# 24 Mar 2020
# Updates: runs python3
# Purpose: run jobs to converge pwscf runs.
# input: scf.in
# output: scf.in and scf.in>scf0.in
# runs pw_script
# first used for BAs, space group 216 -43m

import numpy as np
import os

from shutil import copyfile


VERBOSE = False
KINDA_VERBOSE = True
RUN_JOBS = True

GAMMA_MIN_VALUE = -0.06
GAMMA_MAX_VALUE = 0.06
GAMMA_INCREMENT = 0.02

BASE_DIRECTORY = "./"
TOTAL_SKIP_READ = 4


def construct_Ts():
    t0 = np.zeros((3,3)) #bulk modulus
    t0[0,0] = 1
    t0[1,1] = 1
    t0[2,2] = 1

    t1 = np.zeros((3,3)) #C11
    t1[0,0] = 1

    t2 = np.zeros((3,3)) #C44
    t2[0,1] = 0.5
    t2[0,2] = 0.5
    t2[1,0] = 0.5
    t2[1,2] = 0.5
    t2[2,0] = 0.5
    t2[2,1] = 0.5

    t3 = np.zeros((3,3)) #C11 + C12
    t3[0,0] = 1
    t3[1,1] = 1


    t4 = np.zeros((3,3)) #C11 - C12
    t4[0,0] = 1
    t4[1,1] = -1


    return [t0, t1, t2, t3, t4]


def check_if_contains_convergence_data(line0):
    split_line = [w for w in line0.strip().split(' ') if not (w=='' or w.isspace())]
    if len(split_line)>0:
        if split_line[0] == "bfgs" and split_line[1] == "converged":
            return True
        else:
            return False
    else:
        return False


def check_if_converged(line0):
    split_line = [w for w in line0.strip().split(' ') if not (w=='' or w.isspace())]
    assert(split_line[-1] == "steps" and split_line[-2] == "bfgs")
    if split_line[-3] == "0":
        return True
    else:
        return False


def run_job(T, gamma, dir_name):
    # create the directory for this job run
    directory = BASE_DIRECTORY + dir_name +"/"
    rerun_job = False
    check_contains_converge_line = False

    if not os.path.exists(directory+"scf.out"):
        print ("does not exist: {0}\n".format(dir_name +"/scf.out"))
    else:
        fout = open(directory+'scf.out', 'r') #scf_short_converged.out
        ftemp = open(directory + 'scftemp', 'w')
        num_lines_read = 0
        total_read = TOTAL_SKIP_READ
        start_read = False
        for line in fout:
            #print(line)
            if (not check_contains_converge_line):
                if check_if_contains_convergence_data(line):
                    check_contains_converge_line = True
                    is_converged = check_if_converged(line)
                    if is_converged:
                        print("converged" + directory + "\n " + line)
            elif (check_contains_converge_line and (not is_converged)):
                if start_read and num_lines_read<total_read:
                    num_lines_read +=1
                    ftemp.write(line) 
                    if VERBOSE:
                        print(line)
                if (line.strip().split(' ')[0] == 'Begin'):
                    start_read = True
                    rerun_job = True
        fout.close()
        ftemp.close()

        if rerun_job:
            fin = open(directory+'scf.in', 'r')
            fnew = open(directory+'scfnew.in', 'w')
            num_lines_skip = 0
            total_skip = TOTAL_SKIP_READ-1
            start_skip = False
            for line in fin:
                if (line.strip().split(' ')[0] == 'ATOMIC_POSITIONS'):
                    start_skip = True
                if start_skip and num_lines_skip<total_skip:
                    num_lines_skip +=1
                else:
                    fnew.write(line) # print(line)
            fin.close()
            ftemp = open(directory + 'scftemp', 'r')
            for line in ftemp:
                fnew.write(line)
                if VERBOSE:
                    print(line)
            ftemp.close()
            fnew.close()
            copyfile(directory+'scf.in', directory+'scf0.in')
            copyfile(directory+'scfnew.in', directory+'scf.in')
            if VERBOSE:
                print ("created SCF input file: {0}\n".format(filename))
            if RUN_JOBS:
                os.chdir(directory)
                if VERBOSE:
                    print ("changed working directory to: {0}\n".format(directory))
                os.system("qsub -q c7 pw_script")
                if KINDA_VERBOSE:
                    print ("executed job for directory: {0}\n".format(dir_name))


if __name__ == "__main__":
    T_list = construct_Ts()
    gamma_list  = np.around(np.arange(GAMMA_MIN_VALUE, GAMMA_MAX_VALUE + GAMMA_INCREMENT, GAMMA_INCREMENT),3)
    T_num = 0
    for T in T_list:
        for gamma in gamma_list:
            if np.abs(gamma) < 10e-10:
                gamma = 0
            dir_name = "job_T{0}_gamma{1}".format(T_num, gamma)

            run_job(T, gamma, dir_name)
        T_num += 1
